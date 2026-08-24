package com.rwb.review.service;

import com.rwb.review.domain.AuditLog;
import com.rwb.review.repo.AuditLogRepository;
import org.springframework.stereotype.Component;

@Component
public class AuditLogger {

    private final AuditLogRepository auditLogRepository;

    public AuditLogger(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actorEmail, String action, String detail) {
        auditLogRepository.save(new AuditLog(actorEmail, action, detail));
    }
}
