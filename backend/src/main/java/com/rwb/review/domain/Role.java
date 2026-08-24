package com.rwb.review.domain;

/**
 * SRS five-role RBAC model.
 *
 * <ul>
 *   <li>EXTERNAL_USER — external company / organization; self-registers and
 *       submits proposals for evaluation.</li>
 *   <li>DIVISION_MANAGER — internal intake, reviewer assignment, communication,
 *       and final decisions.</li>
 *   <li>REVIEWER — technical evaluator; works dockets assigned by a Division
 *       Manager and submits recommendations.</li>
 *   <li>SUPER_REVIEWER — internal oversight; read-only visibility across all
 *       reviews and system-wide analytics.</li>
 *   <li>ADMIN — system administration: user management, registration
 *       confirmation, audit logs and maintenance.</li>
 * </ul>
 */
public enum Role {
    ADMIN,
    EXTERNAL_USER,
    REVIEWER,
    DIVISION_MANAGER,
    SUPER_REVIEWER
}
