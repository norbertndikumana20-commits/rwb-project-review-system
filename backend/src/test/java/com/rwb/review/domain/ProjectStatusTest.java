package com.rwb.review.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Locks in the Fig 11.4 state machine, including the BR-9 fix:
 * Rejected projects may transition to Resubmitted (not just Archived).
 */
class ProjectStatusTest {

    @Test
    void rejectedCanResubmit() {
        assertTrue(ProjectStatus.REJECTED.canTransitionTo(ProjectStatus.RESUBMITTED));
    }

    @Test
    void rejectedCanArchive() {
        assertTrue(ProjectStatus.REJECTED.canTransitionTo(ProjectStatus.ARCHIVED));
    }

    @Test
    void resubmittedReturnsToReview() {
        assertTrue(ProjectStatus.RESUBMITTED.canTransitionTo(ProjectStatus.IN_REVIEW));
        assertTrue(ProjectStatus.RESUBMITTED.canTransitionTo(ProjectStatus.APPROVED));
        assertTrue(ProjectStatus.RESUBMITTED.canTransitionTo(ProjectStatus.REJECTED));
    }

    @Test
    void approvedIsTerminalExceptArchive() {
        assertTrue(ProjectStatus.APPROVED.canTransitionTo(ProjectStatus.ARCHIVED));
        assertFalse(ProjectStatus.APPROVED.canTransitionTo(ProjectStatus.RESUBMITTED));
        assertFalse(ProjectStatus.APPROVED.canTransitionTo(ProjectStatus.SUBMITTED));
    }

    @Test
    void archivedIsTerminal() {
        assertFalse(ProjectStatus.ARCHIVED.canTransitionTo(ProjectStatus.SUBMITTED));
        assertFalse(ProjectStatus.ARCHIVED.canTransitionTo(ProjectStatus.RESUBMITTED));
    }

    @Test
    void draftCanSubmit() {
        assertTrue(ProjectStatus.DRAFT.canTransitionTo(ProjectStatus.SUBMITTED));
        assertFalse(ProjectStatus.DRAFT.canTransitionTo(ProjectStatus.APPROVED));
    }
}
