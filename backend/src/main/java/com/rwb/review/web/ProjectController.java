package com.rwb.review.web;

import com.rwb.review.dto.ProjectDtos;
import com.rwb.review.dto.UserDtos;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDtos.ProjectResponse create(@Valid @RequestBody ProjectDtos.ProjectRequest request) {
        return projectService.createProject(AuthenticatedUser.current(), request);
    }

    @GetMapping
    public List<ProjectDtos.ProjectResponse> list() {
        return projectService.listProjects(AuthenticatedUser.current());
    }

    @GetMapping("/stats")
    public ProjectDtos.StatsResponse stats() {
        return projectService.stats(AuthenticatedUser.current());
    }

    @GetMapping("/{id}")
    public ProjectDtos.ProjectResponse get(@PathVariable Long id) {
        return projectService.getProject(AuthenticatedUser.current(), id);
    }

    @PostMapping("/{id}/submit")
    public ProjectDtos.ProjectResponse submit(@PathVariable Long id) {
        return projectService.submit(AuthenticatedUser.current(), id);
    }

    @PostMapping("/{id}/resubmit")
    public ProjectDtos.ProjectResponse resubmit(@PathVariable Long id) {
        return projectService.resubmit(AuthenticatedUser.current(), id);
    }

    @PostMapping("/{id}/approve")
    public ProjectDtos.ProjectResponse approve(@PathVariable Long id,
                                               @RequestBody(required = false) ProjectDtos.ReviewDecisionRequest body) {
        return projectService.approve(AuthenticatedUser.current(), id,
                body != null ? body.comments() : null);
    }

    @PostMapping("/{id}/reject")
    public ProjectDtos.ProjectResponse reject(@PathVariable Long id,
                                              @RequestBody(required = false) ProjectDtos.ReviewDecisionRequest body) {
        return projectService.reject(AuthenticatedUser.current(), id,
                body != null ? body.comments() : null);
    }

    @PatchMapping("/{id}/details")
    public ProjectDtos.ProjectResponse updateDetails(@PathVariable Long id,
                                                     @Valid @RequestBody ProjectDtos.ProjectDetailsUpdateRequest body) {
        return projectService.updateDetails(AuthenticatedUser.current(), id, body);
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDtos.AttachmentResponse upload(@PathVariable Long id,
                                                 @RequestParam("file") MultipartFile file) {
        return projectService.uploadAttachment(AuthenticatedUser.current(), id, file);
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id, @PathVariable Long attachmentId) {
        ProjectDtos.AttachmentDownload dl = projectService.getAttachment(AuthenticatedUser.current(), id, attachmentId);
        MediaType mediaType = null;
        if (dl.contentType() != null) {
            try {
                mediaType = MediaType.parseMediaType(dl.contentType());
            } catch (org.springframework.http.InvalidMediaTypeException ignored) {
                mediaType = null;
            }
        }
        String encoded = URLEncoder.encode(dl.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(mediaType != null ? mediaType : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + dl.fileName().replace("\"", "") + "\"; filename*=UTF-8''" + encoded)
                .contentLength(dl.sizeBytes())
                .body(new FileSystemResource(dl.file()));
    }

    @PostMapping("/{id}/recommend")
    public ProjectDtos.ProjectResponse recommend(@PathVariable Long id,
                                                 @Valid @RequestBody ProjectDtos.RecommendationRequest body) {
        return projectService.recommend(AuthenticatedUser.current(), id, body.decision(), body.comments());
    }

    @PostMapping("/{id}/archive")
    public ProjectDtos.ProjectResponse archive(@PathVariable Long id) {
        return projectService.archive(AuthenticatedUser.current(), id);
    }

    @PostMapping("/{id}/assign")
    public ProjectDtos.ProjectResponse assign(@PathVariable Long id,
                                              @Valid @RequestBody UserDtos.AssignReviewerRequest request) {
        return projectService.assignReviewer(AuthenticatedUser.current(), id, request.reviewerId());
    }
}
