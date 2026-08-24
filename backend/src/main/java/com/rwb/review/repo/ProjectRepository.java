package com.rwb.review.repo;

import com.rwb.review.domain.Project;
import com.rwb.review.domain.ProjectStatus;
import com.rwb.review.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOrderByCreatedAtDesc();

    List<Project> findTop8ByOrderByCreatedAtDesc();

    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Project> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);

    long countByStatus(ProjectStatus status);

    /** Open dockets whose feedback due date has arrived and not yet been alerted. */
    List<Project> findByStatusInAndFeedbackDueDateLessThanEqualAndDeadlineNotifiedFalse(
            List<ProjectStatus> statuses, LocalDate date);

    /** Highest id so far — used to mint docket numbers before the INSERT. */
    @Query("SELECT COALESCE(MAX(p.id), 0) FROM Project p")
    Long maxId();

    /** Distinct reviewers currently assigned to projects owned by one organization. */
    @Query("SELECT DISTINCT p.reviewer FROM Project p "
            + "WHERE p.reviewer IS NOT NULL AND p.owner.organization.id = :orgId")
    List<User> findAssignedReviewersForOrganization(@Param("orgId") Long orgId);
}
