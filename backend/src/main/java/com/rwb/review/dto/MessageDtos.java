package com.rwb.review.dto;

import com.rwb.review.domain.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class MessageDtos {

    private MessageDtos() {
    }

    public record SendMessageRequest(
            @NotNull Long recipientId,
            @Size(max = 255) String subject,
            @NotBlank @Size(max = 4000) String body) {
    }

    public record MessageResponse(
            Long id,
            Long senderId,
            String senderName,
            Long recipientId,
            String recipientName,
            String subject,
            String body,
            boolean read,
            Instant createdAt) {

        public static MessageResponse from(Message m) {
            return new MessageResponse(
                    m.getId(),
                    m.getSender().getId(),
                    m.getSender().getFullName(),
                    m.getRecipient().getId(),
                    m.getRecipient().getFullName(),
                    m.getSubject(),
                    m.getBody(),
                    m.isRead(),
                    m.getCreatedAt());
        }
    }

    /** One thread in the message center, keyed by the other party. */
    public record ConversationResponse(
            Long counterpartId,
            String counterpartName,
            String counterpartEmail,
            String counterpartOrganization,
            String role,
            String lastMessage,
            long unreadCount,
            Instant lastAt) {
    }
}
