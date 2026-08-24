package com.rwb.review.domain;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

/**
 * Project state machine (Fig 11.4 + BR-9 fix).
 *
 * BR-9: Rejected projects may transition to Resubmitted (not just Archived),
 * retaining full attachment version history and review history.
 *
 * <pre>
 * DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED -> ARCHIVED
 *                       └──> REJECTED -> RESUBMITTED -> IN_REVIEW
 *                                       └──> ARCHIVED
 * </pre>
 */
public enum ProjectStatus {
    DRAFT,
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REJECTED,
    RESUBMITTED,
    ARCHIVED;

    /** Allowed transitions per state. */
    public static final Map<ProjectStatus, Set<ProjectStatus>> TRANSITIONS = transitions();

    private static Map<ProjectStatus, Set<ProjectStatus>> transitions() {
        Map<ProjectStatus, Set<ProjectStatus>> map = new EnumMap<>(ProjectStatus.class);
        map.put(DRAFT, Set.of(SUBMITTED, ARCHIVED));
        map.put(SUBMITTED, Set.of(IN_REVIEW, APPROVED, REJECTED));
        map.put(IN_REVIEW, Set.of(APPROVED, REJECTED));
        // BR-9: rejected projects can be resubmitted, not only archived.
        map.put(REJECTED, Set.of(RESUBMITTED, ARCHIVED));
        map.put(RESUBMITTED, Set.of(IN_REVIEW, APPROVED, REJECTED));
        map.put(APPROVED, Set.of(ARCHIVED));
        map.put(ARCHIVED, Set.of());
        return map;
    }

    public boolean canTransitionTo(ProjectStatus next) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }
}
