package com.rwb.review.repo;

import com.rwb.review.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** All messages sent by or addressed to the given user, oldest first. */
    List<Message> findBySenderIdOrRecipientIdOrderByCreatedAtAsc(Long senderId, Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    /** Unread messages from one sender to one recipient (drives notification dedupe). */
    long countBySenderIdAndRecipientIdAndReadFalse(Long senderId, Long recipientId);
}
