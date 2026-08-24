package com.rwb.review.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class MailDtos {

    private MailDtos() {
    }

    /** Redacted view of the configured mail pipeline — never exposes the password. */
    public record MailStatusResponse(
            boolean enabled,
            String from,
            String displayName,
            String verifyUrl,
            String host,
            int port,
            boolean configured) {
    }

    public record MailTestRequest(
            @NotBlank @Email String to) {
    }

    public record MailTestResponse(boolean ok, String message) {
    }
}
