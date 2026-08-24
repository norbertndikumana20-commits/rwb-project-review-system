package com.rwb.review.service;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Attachment;
import com.rwb.review.domain.Notification;
import com.rwb.review.domain.Project;
import com.rwb.review.domain.ProjectStatus;
import com.rwb.review.domain.Review;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.dto.ProjectDtos;
import com.rwb.review.repo.AttachmentRepository;
import com.rwb.review.repo.NotificationRepository;
import com.rwb.review.repo.ProjectRepository;
import com.rwb.review.repo.ReviewRepository;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.Year;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProjectService {

    /** The three reviewer recommendation decisions (SRS role 3). */
    private static final Set<String> RECOMMENDATIONS = Set.of("APPROVED", "REJECTED", "REQUEST_INFO");

    /**
     * File types accepted as submission attachments: a ZIP of project reports
     * or a supporting document (PDF, Word, Excel). Anything else is rejected.
     */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "zip", "pdf", "doc", "docx", "xls", "xlsx");

    /** Lower-cased file extension (without the dot), or "" when absent. */
    private static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 || dot == fileName.length() - 1
                ? ""
                : fileName.substring(dot + 1).toLowerCase();
    }

    private final ProjectRepository projectRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final AuditLogger auditLogger;
    private final String uploadsDir;

    public ProjectService(ProjectRepository projectRepository,
                          ReviewRepository reviewRepository,
                          NotificationRepository notificationRepository,
                          UserRepository userRepository,
                          AttachmentRepository attachmentRepository,
                          AuditLogger auditLogger,
                          @Value("${app.uploads.dir:./uploads}") String uploadsDir) {
        this.projectRepository = projectRepository;
        this.reviewRepository = reviewRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.attachmentRepository = attachmentRepository;
        this.auditLogger = auditLogger;
        this.uploadsDir = uploadsDir;
    }

    /**
     * Creates a project submission. When the owner's account is still
     * ACTIVE_FIRST_PROJECT_REQUIRED, this is their forced first project and
     * completing it flips the account to ACTIVE (SRS v2.1 lifecycle step 4).
     */
    @Transactional
    public ProjectDtos.ProjectResponse createProject(AuthenticatedUser actor,
                                                     ProjectDtos.ProjectRequest request) {
        User owner = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
        if (owner.getRole() != Role.EXTERNAL_USER) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Only external company accounts may submit projects.");
        }
        Project project = new Project(request.title().trim(), request.summary(), request.category(), owner);
        project.setLink(normalizeLink(request.link()));
        if (request.location() != null && !request.location().isBlank()) {
            project.setLocation(request.location().trim());
        }
        if (request.notes() != null && !request.notes().isBlank()) {
            project.setNotes(request.notes().trim());
        }
        if (request.feedbackDueDate() != null) {
            project.setFeedbackDueDate(request.feedbackDueDate());
        }
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setSubmittedAt(Instant.now());
        // Mint the docket number up front: the column is NOT NULL, so the
        // number must exist before the INSERT (identity id is unknown yet).
        long next = projectRepository.maxId() + 1;
        project.setDocketNumber(String.format("RWB-%d-%04d", Year.now().getValue(), next));
        project = projectRepository.save(project);

        if (owner.getAccountStatus() == AccountStatus.ACTIVE_FIRST_PROJECT_REQUIRED) {
            owner.setAccountStatus(AccountStatus.ACTIVE);
            userRepository.save(owner);
            auditLogger.log(actor.getEmail(), "FIRST_PROJECT",
                    "First project " + project.getDocketNumber() + " submitted; account activated.");
        }
        auditLogger.log(actor.getEmail(), "PROJECT_SUBMIT",
                "Submitted " + project.getDocketNumber() + ": " + project.getTitle());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /**
     * Role-scoped project list:
     * EXTERNAL_USER sees only their own submissions, REVIEWER sees only dockets
     * assigned to them, internal roles (DM / Super Reviewer / Admin) see all.
     */
    @Transactional(readOnly = true)
    public List<ProjectDtos.ProjectResponse> listProjects(AuthenticatedUser actor) {
        return visibleProjects(load(actor))
                .stream().map(ProjectDtos.ProjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDtos.ProjectResponse getProject(AuthenticatedUser actor, Long id) {
        Project project = findProject(id);
        requireVisible(actor, project);
        return ProjectDtos.ProjectResponse.from(project);
    }

    @Transactional
    public ProjectDtos.ProjectResponse submit(AuthenticatedUser actor, Long id) {
        Project project = findProject(id);
        requireOwner(actor, project);
        transition(project, ProjectStatus.SUBMITTED);
        project.setSubmittedAt(Instant.now());
        projectRepository.save(project);
        auditLogger.log(actor.getEmail(), "PROJECT_SUBMIT",
                "Submitted " + project.getDocketNumber() + ": " + project.getTitle());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /** BR-9: a rejected project may be resubmitted, retaining history. */
    @Transactional
    public ProjectDtos.ProjectResponse resubmit(AuthenticatedUser actor, Long id) {
        Project project = findProject(id);
        requireOwner(actor, project);
        transition(project, ProjectStatus.RESUBMITTED);
        project.setSubmittedAt(Instant.now());
        projectRepository.save(project);
        auditLogger.log(actor.getEmail(), "PROJECT_RESUBMIT",
                "Resubmitted " + project.getDocketNumber() + " (BR-9).");
        return ProjectDtos.ProjectResponse.from(project);
    }

    /** Final approval decision — Division Manager (or Admin) authority. */
    @Transactional
    public ProjectDtos.ProjectResponse approve(AuthenticatedUser actor, Long id, String comments) {
        Project project = findProject(id);
        requireDivisionManager(actor);
        requireNotOwner(actor, project);
        transition(project, ProjectStatus.APPROVED);
        User decider = load(actor);
        // The assigned reviewer stays on the docket; the decision is recorded
        // in the Review row below (SRS: DM decides, reviewer remains assigned).
        projectRepository.save(project);
        reviewRepository.save(new Review("APPROVED", comments, project, decider));
        notifyOwner(project, "Project " + project.getDocketNumber() + " approved",
                "Your project \"" + project.getTitle() + "\" has been approved by " + actor.getFullName() + ".");
        auditLogger.log(actor.getEmail(), "PROJECT_APPROVE", "Approved " + project.getDocketNumber());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /** Return / reject for revision — Division Manager (or Admin) authority. */
    @Transactional
    public ProjectDtos.ProjectResponse reject(AuthenticatedUser actor, Long id, String comments) {
        Project project = findProject(id);
        requireDivisionManager(actor);
        requireNotOwner(actor, project);
        transition(project, ProjectStatus.REJECTED);
        User decider = load(actor);
        // The assigned reviewer stays on the docket; the decision is recorded
        // in the Review row below (SRS: DM decides, reviewer remains assigned).
        projectRepository.save(project);
        reviewRepository.save(new Review("REJECTED", comments, project, decider));
        notifyOwner(project, "Project " + project.getDocketNumber() + " returned",
                "Your project \"" + project.getTitle() + "\" was returned. You may resubmit with revisions.");
        auditLogger.log(actor.getEmail(), "PROJECT_REJECT", "Rejected " + project.getDocketNumber());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /** Assigns a reviewer; SUBMITTED/RESUBMITTED -> IN_REVIEW. DM-only action. */
    @Transactional
    public ProjectDtos.ProjectResponse assignReviewer(AuthenticatedUser actor, Long projectId, Long reviewerId) {
        Project project = findProject(projectId);
        requireDivisionManager(actor);
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reviewer not found."));
        if (reviewer.getRole() != Role.REVIEWER) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only users with the REVIEWER role can be assigned to a docket.");
        }
        if (reviewer.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only ACTIVE accounts can be assigned reviews.");
        }
        if (project.getStatus() != ProjectStatus.SUBMITTED
                && project.getStatus() != ProjectStatus.RESUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only received dockets can be assigned for review.");
        }
        transition(project, ProjectStatus.IN_REVIEW);
        project.setReviewer(reviewer);
        projectRepository.save(project);
        notificationRepository.save(new Notification(
                "Docket " + project.getDocketNumber() + " assigned to you",
                "You have been assigned to review \"" + project.getTitle() + "\".",
                reviewer, project));
        auditLogger.log(actor.getEmail(), "ASSIGN_REVIEWER",
                "Assigned " + project.getDocketNumber() + " to " + reviewer.getEmail());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /**
     * Reviewer recommendation on a docket assigned to them (SRS role 3).
     * Writes a Review row (APPROVED / REJECTED / REQUEST_INFO) and notifies the
     * Division Managers; the docket stays IN_REVIEW until a DM decides.
     */
    @Transactional
    public ProjectDtos.ProjectResponse recommend(AuthenticatedUser actor, Long projectId,
                                                 String decision, String comments) {
        Project project = findProject(projectId);
        User reviewer = load(actor);
        if (reviewer.getRole() != Role.REVIEWER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only reviewers may submit recommendations.");
        }
        if (project.getReviewer() == null || !project.getReviewer().getId().equals(reviewer.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You may only recommend on dockets assigned to you.");
        }
        if (project.getStatus() != ProjectStatus.IN_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "Only dockets under review can receive recommendations.");
        }
        String d = decision == null ? "" : decision.trim().toUpperCase();
        if (!RECOMMENDATIONS.contains(d)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Recommendation must be APPROVED, REJECTED or REQUEST_INFO.");
        }
        reviewRepository.save(new Review(d, comments, project, reviewer));
        String verb = switch (d) {
            case "APPROVED" -> "recommended approval of";
            case "REJECTED" -> "recommended rejection of";
            default -> "requested additional information on";
        };
        for (User dm : userRepository.findByRole(Role.DIVISION_MANAGER)) {
            notificationRepository.save(new Notification(
                    "Reviewer recommendation on " + project.getDocketNumber(),
                    reviewer.getFullName() + " has " + verb + " \"" + project.getTitle() + "\".",
                    dm, project));
        }
        auditLogger.log(actor.getEmail(), "REVIEWER_RECOMMEND",
                "Recommended " + d + " on " + project.getDocketNumber());
        return ProjectDtos.ProjectResponse.from(project);
    }

    @Transactional
    public ProjectDtos.ProjectResponse archive(AuthenticatedUser actor, Long id) {
        Project project = findProject(id);
        requireDivisionManager(actor);
        transition(project, ProjectStatus.ARCHIVED);
        projectRepository.save(project);
        auditLogger.log(actor.getEmail(), "PROJECT_ARCHIVE", "Archived " + project.getDocketNumber());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /** Role-scoped dashboard statistics. */
    @Transactional(readOnly = true)
    public ProjectDtos.StatsResponse stats(AuthenticatedUser actor) {
        List<Project> all = visibleProjects(load(actor));
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ProjectStatus status : ProjectStatus.values()) {
            byStatus.put(status.name(), all.stream().filter(p -> p.getStatus() == status).count());
        }
        long pending = byStatus.get("SUBMITTED") + byStatus.get("IN_REVIEW") + byStatus.get("RESUBMITTED");
        List<ProjectDtos.ProjectResponse> recent = all.stream()
                .sorted(Comparator.comparing(Project::getCreatedAt).reversed())
                .limit(8)
                .map(ProjectDtos.ProjectResponse::from).toList();

        List<ProjectDtos.StatsResponse.MonthlyCount> monthly = monthlySubmissions(all);

        long completedReviews = all.stream()
                .filter(p -> p.getStatus() == ProjectStatus.APPROVED
                        || p.getStatus() == ProjectStatus.REJECTED)
                .count();
        // Self-consistent donut: Assigned = Completed + Remaining.
        long assignedReviews = completedReviews + pending;
        int progress = completedReviews + pending == 0
                ? 0
                : (int) Math.round((completedReviews * 100.0) / (completedReviews + pending));
        var workload = new ProjectDtos.StatsResponse.Workload(
                assignedReviews, completedReviews, pending, progress);

        return new ProjectDtos.StatsResponse(
                all.size(),
                pending,
                byStatus,
                recent,
                monthly,
                workload,
                byStatus.get("SUBMITTED"));
    }

    /** Received/completed counts for the last six months, oldest first. */
    private List<ProjectDtos.StatsResponse.MonthlyCount> monthlySubmissions(List<Project> all) {
        ZoneId utc = ZoneId.of("UTC");
        YearMonth current = YearMonth.now(utc);
        List<ProjectDtos.StatsResponse.MonthlyCount> result = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            long received = all.stream()
                    .filter(p -> p.getSubmittedAt() != null
                            && YearMonth.from(p.getSubmittedAt().atZone(utc)).equals(month))
                    .count();
            long completed = all.stream()
                    .filter(p -> p.getUpdatedAt() != null
                            && (p.getStatus() == ProjectStatus.APPROVED
                                || p.getStatus() == ProjectStatus.REJECTED
                                || p.getStatus() == ProjectStatus.ARCHIVED)
                            && YearMonth.from(p.getUpdatedAt().atZone(utc)).equals(month))
                    .count();
            result.add(new ProjectDtos.StatsResponse.MonthlyCount(
                    month.toString(), received, completed));
        }
        return result;
    }

    /**
     * The owning company may update submission details (external link, location,
     * notes for the description) while the docket is still open. Decided or
     * archived dockets are frozen.
     */
    @Transactional
    public ProjectDtos.ProjectResponse updateDetails(AuthenticatedUser actor, Long id,
                                                     ProjectDtos.ProjectDetailsUpdateRequest request) {
        Project project = findProject(id);
        requireOwner(actor, project);
        if (project.getStatus() == ProjectStatus.APPROVED
                || project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Decided dockets are frozen and cannot be edited.");
        }
        if (request.link() != null) {
            project.setLink(normalizeLink(request.link()));
        }
        if (request.location() != null) {
            String location = request.location().trim();
            project.setLocation(location.isBlank() ? null : location);
        }
        if (request.notes() != null) {
            String notes = request.notes().trim();
            project.setNotes(notes.isBlank() ? null : notes);
        }
        if (request.feedbackDueDate() != null) {
            project.setFeedbackDueDate(request.feedbackDueDate());
            // The owner may move the date forward; allow the alert to fire again
            // for the new deadline.
            project.setDeadlineNotified(false);
        }
        projectRepository.save(project);
        auditLogger.log(actor.getEmail(), "PROJECT_DETAILS_UPDATE",
                "Updated details for " + project.getDocketNumber());
        return ProjectDtos.ProjectResponse.from(project);
    }

    /**
     * Attaches a submission file (ZIP of reports, supporting letter, or other
     * documents) to a project. Only the owning external company may attach
     * files. Bytes are stored on disk under the configured uploads directory.
     */
    @Transactional
    public ProjectDtos.AttachmentResponse uploadAttachment(AuthenticatedUser actor, Long projectId,
                                                          MultipartFile file) {
        Project project = findProject(projectId);
        if (!project.getOwner().getId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Only the submitting company may attach files.");
        }
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No file was provided.");
        }
        String original = file.getOriginalFilename();
        String safeName = original == null || original.isBlank()
                ? "attachment"
                : Paths.get(original).getFileName().toString();
        String ext = extensionOf(safeName);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type. Upload a ZIP of project reports, or a PDF, Word or Excel document.");
        }
        String kind = "zip".equals(ext) ? "ZIP" : "DOCUMENT";
        try {
            Path dir = Path.of(uploadsDir, String.valueOf(projectId));
            Files.createDirectories(dir);
            String key = UUID.randomUUID() + "_" + safeName;
            Files.copy(file.getInputStream(), dir.resolve(key), StandardCopyOption.REPLACE_EXISTING);

            int version = 1 + (int) attachmentRepository.countByProjectIdAndFileName(projectId, safeName);
            Attachment attachment = new Attachment(
                    safeName,
                    kind,
                    file.getContentType(),
                    file.getSize(),
                    projectId + "/" + key,
                    version,
                    project);
            attachmentRepository.save(attachment);
            auditLogger.log(actor.getEmail(), "ATTACH_UPLOAD",
                    "Uploaded " + safeName + " (" + file.getSize() + " bytes) to " + project.getDocketNumber());
            return ProjectDtos.AttachmentResponse.from(attachment);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store the file: " + e.getMessage());
        }
    }

    /** Resolves an attachment for download; visible to anyone who can see the project. */
    @Transactional(readOnly = true)
    public ProjectDtos.AttachmentDownload getAttachment(AuthenticatedUser actor, Long projectId, Long attachmentId) {
        Project project = findProject(projectId);
        requireVisible(actor, project);
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attachment not found."));
        if (attachment.getProject() == null || !attachment.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment not found on this project.");
        }
        Path root = Path.of(uploadsDir).toAbsolutePath().normalize();
        Path file = root.resolve(attachment.getStorageKey()).normalize();
        if (!file.startsWith(root)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment path is invalid.");
        }
        if (!Files.isRegularFile(file)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment file is missing from storage.");
        }
        return new ProjectDtos.AttachmentDownload(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                file);
    }

    // ---- helpers ----

    private List<Project> visibleProjects(User me) {
        if (me.getRole() == Role.EXTERNAL_USER) {
            return projectRepository.findByOwnerIdOrderByCreatedAtDesc(me.getId());
        }
        if (me.getRole() == Role.REVIEWER) {
            return projectRepository.findByReviewerIdOrderByCreatedAtDesc(me.getId());
        }
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found."));
    }

    private User load(AuthenticatedUser actor) {
        return userRepository.findById(actor.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    /** Detail-view visibility: internal roles see all, others only their scope. */
    private void requireVisible(AuthenticatedUser actor, Project project) {
        User me = load(actor);
        switch (me.getRole()) {
            case ADMIN, DIVISION_MANAGER, SUPER_REVIEWER -> {
                return;
            }
            case EXTERNAL_USER -> {
                if (project.getOwner().getId().equals(me.getId())) {
                    return;
                }
            }
            case REVIEWER -> {
                if (project.getReviewer() != null && project.getReviewer().getId().equals(me.getId())) {
                    return;
                }
            }
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "This project is not visible to your account.");
    }

    private void requireOwner(AuthenticatedUser actor, Project project) {
        if (!project.getOwner().getId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the project owner may perform this action.");
        }
    }

    /** Internal decision-makers may not decide on dockets they filed themselves. */
    private void requireNotOwner(AuthenticatedUser actor, Project project) {
        if (project.getOwner().getId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "A decision-maker may not decide on their own docket.");
        }
    }

    /** Intake, assignment, and final decisions are Division Manager authority. */
    private void requireDivisionManager(AuthenticatedUser actor) {
        boolean allowed = actor.getRole() == Role.DIVISION_MANAGER
                || actor.getRole() == Role.ADMIN;
        if (!allowed) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Division Manager privileges required.");
        }
    }

    /** Validates an external project link; blank becomes null, non-http(s) is rejected. */
    private String normalizeLink(String link) {
        if (link == null || link.isBlank()) {
            return null;
        }
        String trimmed = link.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Project link must be a valid http(s) URL.");
        }
        return trimmed;
    }

    private void transition(Project project, ProjectStatus next) {
        if (!project.getStatus().canTransitionTo(next)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Illegal transition " + project.getStatus() + " -> " + next
                            + " (see ProjectStatus.TRANSITIONS).");
        }
        project.setStatus(next);
    }

    private void notifyOwner(Project project, String subject, String body) {
        notificationRepository.save(new Notification(subject, body, project.getOwner(), project));
    }
}
