package com.rwb.review.service;

import com.rwb.review.domain.Notification;
import com.rwb.review.domain.Project;
import com.rwb.review.domain.ProjectStatus;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.repo.NotificationRepository;
import com.rwb.review.repo.ProjectRepository;
import com.rwb.review.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily (every six hours) sweep for dockets whose feedback due date has been
 * reached while still open. Raises notifications so the review body and the
 * submitting company are alerted without anyone having to watch the calendar.
 *
 * Recipients:
 *  - the submitting company (owner) always;
 *  - the assigned reviewer when a reviewer is on the docket (they must
 *    deliver the feedback);
 *  - the Division Managers when no reviewer has been assigned yet (the
 *    docket needs to be assigned before feedback can be delivered).
 *
 * Each docket is alerted once: deadlineNotified is set after the first sweep
 * (and cleared again if the owner moves the date forward).
 */
@Component
public class DeadlineNotifier {

    private static final Logger log = LoggerFactory.getLogger(DeadlineNotifier.class);

    private static final List<ProjectStatus> OPEN = List.of(
            ProjectStatus.SUBMITTED, ProjectStatus.IN_REVIEW, ProjectStatus.RESUBMITTED);

    private final ProjectRepository projectRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public DeadlineNotifier(ProjectRepository projectRepository,
                            NotificationRepository notificationRepository,
                            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /** Catch any deadlines that came due while the server was down. */
    @EventListener(ApplicationReadyEvent.class)
    public void sweepOnStartup() {
        notifyDueDeadlines();
    }

    @Scheduled(cron = "0 0 */6 * * *")
    @Transactional
    public void notifyDueDeadlines() {
        LocalDate today = LocalDate.now();
        List<Project> due = projectRepository
                .findByStatusInAndFeedbackDueDateLessThanEqualAndDeadlineNotifiedFalse(OPEN, today);
        if (due.isEmpty()) {
            return;
        }
        int raised = 0;
        for (Project project : due) {
            String date = project.getFeedbackDueDate().toString();
            String docket = project.getDocketNumber();

            notificationRepository.save(new Notification(
                    "Feedback due on " + docket,
                    "The review feedback date (" + date + ") for your project \""
                            + project.getTitle() + "\" has been reached.",
                    project.getOwner(), project));
            raised++;

            User reviewer = project.getReviewer();
            if (reviewer != null) {
                notificationRepository.save(new Notification(
                        "Review feedback due on " + docket,
                        "Review feedback is due today (" + date + ") for \""
                                + project.getTitle() + "\". Please submit your recommendation.",
                        reviewer, project));
                raised++;
            } else {
                for (User dm : userRepository.findByRole(Role.DIVISION_MANAGER)) {
                    notificationRepository.save(new Notification(
                            "Docket awaiting assignment · " + docket,
                            "\"" + project.getTitle() + "\" reached its feedback due date ("
                                    + date + ") and no reviewer has been assigned yet.",
                            dm, project));
                    raised++;
                }
            }

            project.setDeadlineNotified(true);
            projectRepository.save(project);
        }
        log.info("Deadline notifier raised {} notification(s) for {} docket(s) due by {}", raised, due.size(), today);
    }
}
