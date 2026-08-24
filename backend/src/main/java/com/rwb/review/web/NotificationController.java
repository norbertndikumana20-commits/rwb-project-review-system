package com.rwb.review.web;

import com.rwb.review.domain.Notification;
import com.rwb.review.dto.ActivityDtos;
import com.rwb.review.repo.NotificationRepository;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<ActivityDtos.NotificationResponse> inbox(@RequestParam(defaultValue = "25") int limit) {
        AuthenticatedUser actor = AuthenticatedUser.current();
        int size = Math.min(Math.max(limit, 1), 100);
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(actor.getId())
                .stream().limit(size).map(ActivityDtos.NotificationResponse::from).toList();
    }

    @PostMapping("/{id}/read")
    @Transactional
    public ActivityDtos.NotificationResponse markRead(@PathVariable Long id) {
        AuthenticatedUser actor = AuthenticatedUser.current();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!notification.getRecipient().getId().equals(actor.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This notification is not addressed to you.");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return ActivityDtos.NotificationResponse.from(notification);
    }
}
