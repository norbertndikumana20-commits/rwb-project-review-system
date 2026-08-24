package com.rwb.review.dto;

import com.rwb.review.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class UserDtos {

    private UserDtos() {
    }

    /**
     * Self-service profile update. fullName is required; email and
     * organizationName are optional — when null/blank the current values
     * are kept.
     */
    public record UpdateProfileRequest(
            @NotBlank @Size(max = 255) String fullName,
            @Email @Size(max = 255) String email,
            @Size(max = 255) String organizationName) {
    }

    /** Self-service password change; requires the current password. */
    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 12, max = 72, message = "New password must be 12-72 characters") String newPassword) {
    }

    public record AssignReviewerRequest(Long reviewerId) {
    }

    /** Admin creates an account directly (skips the registration lifecycle). */
    public record AdminCreateUserRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 12, max = 72, message = "Password must be 12-72 characters") String password,
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank String role,
            @Size(max = 255) String organizationName) {
    }

    /** Admin edits an account; password is optional (only reset when provided). */
    public record AdminUpdateUserRequest(
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank String role,
            @Size(max = 255) String organizationName,
            @Size(min = 12, max = 72, message = "Password must be 12-72 characters") String password) {
    }

    public record UserResponse(
            Long id,
            String email,
            String fullName,
            String role,
            String accountStatus,
            String organizationName,
            Instant createdAt) {

        public static UserResponse from(User user) {
            String org = user.getOrganization() != null ? user.getOrganization().getName() : null;
            return new UserResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole().name(),
                    user.getAccountStatus().name(),
                    org,
                    user.getCreatedAt());
        }
    }
}
