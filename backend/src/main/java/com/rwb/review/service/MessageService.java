package com.rwb.review.service;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Message;
import com.rwb.review.domain.Notification;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.dto.MessageDtos;
import com.rwb.review.repo.MessageRepository;
import com.rwb.review.repo.NotificationRepository;
import com.rwb.review.repo.ProjectRepository;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectRepository projectRepository;
    private final AuditLogger auditLogger;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          NotificationRepository notificationRepository,
                          ProjectRepository projectRepository,
                          AuditLogger auditLogger) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.projectRepository = projectRepository;
        this.auditLogger = auditLogger;
    }

    /**
     * Accounts the actor may start a conversation with. External companies are
     * limited to the Division Manager and the reviewers assigned to the projects
     * their organization submitted; every other role may message any active
     * account (self always excluded).
     */
    public List<User> allowedRecipients(User actor) {
        List<User> allowed;
        if (actor.getRole() == Role.EXTERNAL_USER) {
            allowed = new ArrayList<>();
            userRepository.findByRole(Role.DIVISION_MANAGER).stream()
                    .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE)
                    .forEach(allowed::add);
            if (actor.getOrganization() != null) {
                allowed.addAll(projectRepository
                        .findAssignedReviewersForOrganization(actor.getOrganization().getId()));
            }
        } else {
            allowed = userRepository.findAll();
        }
        return allowed.stream()
                .filter(u -> u.getAccountStatus() == AccountStatus.ACTIVE && !u.getId().equals(actor.getId()))
                .distinct()
                .toList();
    }

    @Transactional
    public MessageDtos.MessageResponse send(AuthenticatedUser actor, MessageDtos.SendMessageRequest request) {
        User sender = load(actor);
        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Recipient not found."));
        if (recipient.getId().equals(sender.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot message yourself.");
        }
        if (recipient.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Recipient account is not active.");
        }
        if (sender.getRole() == Role.EXTERNAL_USER
                && allowedRecipients(sender).stream().noneMatch(u -> u.getId().equals(recipient.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "External accounts can only message the Division Manager and the reviewer assigned to their submitted project.");
        }
        String body = request.body().trim();
        String subject = request.subject() != null && !request.subject().isBlank()
                ? request.subject().trim()
                : null;
        Message message = new Message(sender, recipient, subject, body);
        messageRepository.save(message);

        // Bell notification only on the first unread message of a burst, so an
        // active back-and-forth doesn't spam the recipient's notifications.
        boolean alreadyUnread = messageRepository
                .countBySenderIdAndRecipientIdAndReadFalse(sender.getId(), recipient.getId()) > 1;
        if (!alreadyUnread) {
            notificationRepository.save(new Notification(
                    subject != null ? subject : "New message from " + sender.getFullName(),
                    sender.getFullName() + " wrote: " + (body.length() > 140 ? body.substring(0, 140) + "…" : body),
                    recipient));
        }
        auditLogger.log(sender.getEmail(), "MESSAGE_SEND",
                "Messaged " + recipient.getEmail() + (subject != null ? ": " + subject : ""));
        return MessageDtos.MessageResponse.from(message);
    }

    /** Threads with every user the actor has corresponded with, newest last message first. */
    @Transactional(readOnly = true)
    public List<MessageDtos.ConversationResponse> conversations(AuthenticatedUser actor) {
        User me = load(actor);
        List<Message> all = messageRepository.findBySenderIdOrRecipientIdOrderByCreatedAtAsc(me.getId(), me.getId());

        Map<Long, List<Message>> byOther = new LinkedHashMap<>();
        for (Message m : all) {
            Long otherId = m.getSender().getId().equals(me.getId()) ? m.getRecipient().getId() : m.getSender().getId();
            byOther.computeIfAbsent(otherId, k -> new ArrayList<>()).add(m);
        }

        List<MessageDtos.ConversationResponse> result = new ArrayList<>();
        for (Map.Entry<Long, List<Message>> entry : byOther.entrySet()) {
            List<Message> msgs = entry.getValue();
            Message last = msgs.get(msgs.size() - 1);
            User other = last.getSender().getId().equals(me.getId()) ? last.getRecipient() : last.getSender();
            long unread = msgs.stream()
                    .filter(m -> m.getRecipient().getId().equals(me.getId()) && !m.isRead())
                    .count();
            String org = other.getOrganization() != null ? other.getOrganization().getName() : null;
            String preview = last.getBody();
            if (preview.length() > 90) preview = preview.substring(0, 90) + "…";
            result.add(new MessageDtos.ConversationResponse(
                    other.getId(),
                    other.getFullName(),
                    other.getEmail(),
                    org,
                    other.getRole().name(),
                    preview,
                    unread,
                    last.getCreatedAt()));
        }
        result.sort(Comparator.comparing(MessageDtos.ConversationResponse::lastAt).reversed());
        return result;
    }

    /** Full thread with one other user, oldest first; incoming messages are marked read. */
    @Transactional
    public List<MessageDtos.MessageResponse> thread(AuthenticatedUser actor, Long otherId) {
        User me = load(actor);
        userRepository.findById(otherId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        List<Message> msgs = messageRepository.findBySenderIdOrRecipientIdOrderByCreatedAtAsc(me.getId(), me.getId())
                .stream()
                .filter(m -> (m.getSender().getId().equals(me.getId()) && m.getRecipient().getId().equals(otherId))
                        || (m.getSender().getId().equals(otherId) && m.getRecipient().getId().equals(me.getId())))
                .toList();
        boolean changed = false;
        for (Message m : msgs) {
            if (m.getRecipient().getId().equals(me.getId()) && !m.isRead()) {
                m.setRead(true);
                changed = true;
            }
        }
        if (changed) {
            messageRepository.saveAll(msgs);
        }
        return msgs.stream().map(MessageDtos.MessageResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(AuthenticatedUser actor) {
        return messageRepository.countByRecipientIdAndReadFalse(actor.getId());
    }

    private User load(AuthenticatedUser actor) {
        return userRepository.findById(actor.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }
}
