package com.rwb.review.domain;

/**
 * Account lifecycle (SRS v2.1 — corrected):
 * PENDING_EMAIL_VERIFICATION -> PENDING_ADMIN_REVIEW ->
 * ACTIVE_FIRST_PROJECT_REQUIRED -> ACTIVE
 *
 * REJECTED is a terminal state applied by administration when a registration
 * is declined at the admin-review gate. DISABLED is set by administrators
 * from the user-management screen to suspend an account without deleting it.
 */
public enum AccountStatus {
    PENDING_EMAIL_VERIFICATION,
    PENDING_ADMIN_REVIEW,
    ACTIVE_FIRST_PROJECT_REQUIRED,
    ACTIVE,
    REJECTED,
    DISABLED
}
