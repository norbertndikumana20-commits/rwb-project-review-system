package com.rwb.review.dto;

import com.rwb.review.domain.AuditLog;
import com.rwb.review.domain.Notification;
import com.rwb.review.domain.Project;

import java.time.Instant;

public final class ActivityDtos {

    private ActivityDtos() {
    }

    /** One entry of the dashboard activity timeline (backed by the audit log). */
    public record ActivityResponse(Long id, String action, String detail, String actorEmail, Instant createdAt) {
        public static ActivityResponse from(AuditLog log) {
            return new ActivityResponse(
                    log.getId(), log.getAction(), log.getDetail(), log.getActorEmail(), log.getCreatedAt());
        }
    }

    /**
     * A bell notification. projectId/docketNumber are present when the
     * notification relates to a docket (click-through target); null for
     * e.g. message alerts.
     */
    public record NotificationResponse(Long id, String subject, String body, boolean read,
                                       Long projectId, String docketNumber, Instant createdAt) {
        public static NotificationResponse from(Notification n) {
            Project project = n.getProject();
            return new NotificationResponse(
                    n.getId(), n.getSubject(), n.getBody(), n.isRead(),
                    project != null ? project.getId() : null,
                    project != null ? project.getDocketNumber() : null,
                    n.getCreatedAt());
        }
    }
}
