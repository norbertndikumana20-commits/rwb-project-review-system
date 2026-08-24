package com.rwb.review.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 12, max = 72, message = "Password must be 12-72 characters") String password,
            @NotBlank String fullName,
            @NotBlank String organizationName) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record ResendRequest(
            @NotBlank @Email String email) {
    }

    public record RegisterResponse(
            String message,
            Long userId,
            String email,
            String accountStatus,
            // True when the verification link was emailed to the address.
            boolean emailSent,
            // Dev-only: returned only when no mail transport is configured.
            String verificationToken) {
    }

    public record VerifyEmailResponse(String message, String accountStatus) {
    }

    public record AuthResponse(String token, UserDtos.UserResponse user) {
    }

    public record MfaRequest(String email) {
    }

    public record MfaRequestResponse(
            // True when the code was emailed to the address.
            boolean emailed,
            // Dev-only: returned only when no mail transport is configured.
            String devCode) {
    }

    public record MfaVerifyRequest(
            @NotBlank @Email String email,
            @NotBlank String code) {
    }

    public record MfaVerifyResponse(boolean valid, String message) {
    }
}
