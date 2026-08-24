package com.rwb.review.web;

import com.rwb.review.dto.MessageDtos;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDtos.MessageResponse send(@Valid @RequestBody MessageDtos.SendMessageRequest request) {
        return messageService.send(AuthenticatedUser.current(), request);
    }

    @GetMapping
    public List<MessageDtos.ConversationResponse> conversations() {
        return messageService.conversations(AuthenticatedUser.current());
    }

    @GetMapping("/unread-count")
    public long unreadCount() {
        return messageService.unreadCount(AuthenticatedUser.current());
    }

    @GetMapping("/with/{userId}")
    public List<MessageDtos.MessageResponse> thread(@PathVariable Long userId) {
        return messageService.thread(AuthenticatedUser.current(), userId);
    }
}
