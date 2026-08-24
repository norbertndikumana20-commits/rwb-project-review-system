package com.rwb.review.web;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.ApiException;
import com.rwb.review.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * User directory: assignable REVIEWER accounts for docket assignment, and
 * message-recipient accounts for the compose picker. External companies only
 * see the Division Manager and the reviewer assigned to their submitted
 * projects; other roles see every active account.
 */
@RestController
@RequestMapping("/api/directory")
public class DirectoryController {

    public record ReviewerEntry(Long id, String fullName, String email) {
        static ReviewerEntry from(User user) {
            return new ReviewerEntry(user.getId(), user.getFullName(), user.getEmail());
        }
    }

    public record UserEntry(Long id, String fullName, String email, String role, String organizationName) {
        static UserEntry from(User user) {
            return new UserEntry(user.getId(), user.getFullName(), user.getEmail(),
                    user.getRole().name(),
                    user.getOrganization() != null ? user.getOrganization().getName() : null);
        }
    }

    private final UserRepository userRepository;
    private final MessageService messageService;

    public DirectoryController(UserRepository userRepository, MessageService messageService) {
        this.userRepository = userRepository;
        this.messageService = messageService;
    }

    @GetMapping("/reviewers")
    public List<ReviewerEntry> reviewers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE
                        && u.getRole() == Role.REVIEWER)
                .map(ReviewerEntry::from)
                .toList();
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<UserEntry> users() {
        User me = userRepository.findById(AuthenticatedUser.current().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
        return messageService.allowedRecipients(me).stream()
                .map(UserEntry::from)
                .toList();
    }
}
