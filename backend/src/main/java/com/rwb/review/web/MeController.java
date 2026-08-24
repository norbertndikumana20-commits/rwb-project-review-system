package com.rwb.review.web;

import com.rwb.review.domain.Organization;
import com.rwb.review.domain.User;
import com.rwb.review.dto.UserDtos;
import com.rwb.review.repo.OrganizationRepository;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.ApiException;
import com.rwb.review.service.AuditLogger;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogger auditLogger;

    public MeController(UserRepository userRepository,
                        OrganizationRepository organizationRepository,
                        PasswordEncoder passwordEncoder,
                        AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogger = auditLogger;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public UserDtos.UserResponse me() {
        AuthenticatedUser actor = AuthenticatedUser.current();
        return userRepository.findById(actor.getId())
                .map(UserDtos.UserResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    /**
     * Self-service profile update: name (required), email (optional — the
     * current value is kept when blank) and organization name (optional —
     * find-or-create, mirroring admin behaviour).
     */
    @PatchMapping
    @Transactional
    public UserDtos.UserResponse update(@Valid @RequestBody UserDtos.UpdateProfileRequest request) {
        AuthenticatedUser actor = AuthenticatedUser.current();
        User user = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        StringBuilder changes = new StringBuilder();

        user.setFullName(request.fullName().trim());
        changes.append("name");

        String newEmail = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (!newEmail.isEmpty() && !newEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
            }
            user.setEmail(newEmail);
            changes.append(", email");
        }

        String orgName = request.organizationName() != null ? request.organizationName().trim() : "";
        if (!orgName.isEmpty() && (user.getOrganization() == null || !orgName.equals(user.getOrganization().getName()))) {
            user.setOrganization(findOrCreateOrganization(orgName));
            changes.append(", organization");
        }

        userRepository.save(user);
        auditLogger.log(user.getEmail(), "PROFILE_UPDATE", "Updated " + changes);
        return UserDtos.UserResponse.from(user);
    }

    /** Changes the password after verifying the current one. */
    @PostMapping("/password")
    @Transactional
    public UserDtos.UserResponse changePassword(@Valid @RequestBody UserDtos.ChangePasswordRequest request) {
        AuthenticatedUser actor = AuthenticatedUser.current();
        User user = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Your current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Your new password must be different from the current one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditLogger.log(user.getEmail(), "PASSWORD_CHANGE", "Password changed.");
        return UserDtos.UserResponse.from(user);
    }

    private Organization findOrCreateOrganization(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String trimmed = name.trim();
        return organizationRepository.findByName(trimmed)
                .orElseGet(() -> organizationRepository.save(new Organization(trimmed)));
    }
}
