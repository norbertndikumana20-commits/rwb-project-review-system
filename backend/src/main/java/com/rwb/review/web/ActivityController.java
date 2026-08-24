package com.rwb.review.web;

import com.rwb.review.dto.ActivityDtos;
import com.rwb.review.repo.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Recent review-body activity, backed by the audit log. Feeds the dashboard
 * timeline; the whole ledger is shared within the review body.
 */
@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final AuditLogRepository auditLogRepository;

    public ActivityController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public List<ActivityDtos.ActivityResponse> recent(@RequestParam(defaultValue = "10") int limit) {
        int size = Math.min(Math.max(limit, 1), 50);
        return auditLogRepository.findAll(
                        PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream().map(ActivityDtos.ActivityResponse::from).toList();
    }
}
