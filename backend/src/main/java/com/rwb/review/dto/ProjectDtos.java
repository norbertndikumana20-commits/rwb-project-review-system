package com.rwb.review.dto;

import com.rwb.review.domain.Attachment;
import com.rwb.review.domain.Project;
import com.rwb.review.domain.Review;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    public record ProjectRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 2000) String summary,
            @Size(max = 64) String category,
            @Size(max = 255) String location,
            @Size(max = 2048) String link,
            @Size(max = 4000) String notes,
            @FutureOrPresent LocalDate feedbackDueDate) {
    }

    /** Owner-only updates to submission details while the docket is open. */
    public record ProjectDetailsUpdateRequest(
            @Size(max = 255) String location,
            @Size(max = 2048) String link,
            @Size(max = 4000) String notes,
            @FutureOrPresent LocalDate feedbackDueDate) {
    }

    public record ReviewDecisionRequest(
            @Size(max = 2000) String comments) {
    }

    /** Reviewer recommendation: APPROVED, REJECTED or REQUEST_INFO. */
    public record RecommendationRequest(
            @NotBlank @Size(max = 16) String decision,
            @Size(max = 2000) String comments) {
    }

    public record ProjectResponse(
            Long id,
            Long ownerId,
            String docketNumber,
            String title,
            String summary,
            String notes,
            String category,
            String location,
            String link,
            String status,
            String ownerName,
            String organizationName,
            String reviewerName,
            int attachmentCount,
            List<AttachmentResponse> attachments,
            List<ReviewResponse> reviewHistory,
            LocalDate feedbackDueDate,
            Instant submittedAt,
            Instant createdAt,
            Instant updatedAt) {

        public static ProjectResponse from(Project p) {
            String reviewer = p.getReviewer() != null ? p.getReviewer().getFullName() : null;
            String org = p.getOwner().getOrganization() != null
                    ? p.getOwner().getOrganization().getName()
                    : null;
            List<AttachmentResponse> attachments = p.getAttachments().stream()
                    .map(AttachmentResponse::from).toList();
            List<ReviewResponse> history = p.getReviews().stream()
                    .map(ReviewResponse::from).toList();
            return new ProjectResponse(
                    p.getId(),
                    p.getOwner().getId(),
                    p.getDocketNumber(),
                    p.getTitle(),
                    p.getSummary(),
                    p.getNotes(),
                    p.getCategory(),
                    p.getLocation(),
                    p.getLink(),
                    p.getStatus().name(),
                    p.getOwner().getFullName(),
                    org,
                    reviewer,
                    attachments.size(),
                    attachments,
                    history,
                    p.getFeedbackDueDate(),
                    p.getSubmittedAt(),
                    p.getCreatedAt(),
                    p.getUpdatedAt());
        }
    }

    public record AttachmentResponse(
            Long id,
            String fileName,
            String kind,
            String contentType,
            long sizeBytes,
            int version,
            Instant createdAt) {

        public static AttachmentResponse from(Attachment a) {
            return new AttachmentResponse(
                    a.getId(),
                    a.getFileName(),
                    a.getKind(),
                    a.getContentType(),
                    a.getSizeBytes(),
                    a.getVersion(),
                    a.getCreatedAt());
        }
    }

    public record ReviewResponse(
            String decision,
            String comments,
            String reviewerName,
            Instant createdAt) {

        public static ReviewResponse from(Review r) {
            String name = r.getReviewer() != null ? r.getReviewer().getFullName() : null;
            return new ReviewResponse(r.getDecision(), r.getComments(), name, r.getCreatedAt());
        }
    }

    /** Resolved attachment ready for streaming to the client. */
    public record AttachmentDownload(
            Long id,
            String fileName,
            String contentType,
            long sizeBytes,
            Path file) {
    }

    public record StatsResponse(
            long total,
            long pendingReviews,
            Map<String, Long> byStatus,
            List<ProjectResponse> recent,
            List<MonthlyCount> monthlySubmissions,
            Workload workload,
            long pendingAssignments) {

        /** One month of the submissions bar chart (last six months). */
        public record MonthlyCount(String month, long received, long completed) {
        }

        /** Review progress used by the workload donut. */
        public record Workload(long assignedReviews,
                               long completedReviews,
                               long remainingReviews,
                               int progressPercent) {
        }
    }
}
