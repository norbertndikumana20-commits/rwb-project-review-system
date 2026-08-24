package com.rwb.review.service;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Organization;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.dto.MailDtos;
import com.rwb.review.dto.UserDtos;
import com.rwb.review.repo.OrganizationRepository;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogger auditLogger;
    private final MailService mailService;

    public AdminService(UserRepository userRepository,
                        OrganizationRepository organizationRepository,
                        PasswordEncoder passwordEncoder,
                        AuditLogger auditLogger,
                        MailService mailService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogger = auditLogger;
        this.mailService = mailService;
    }

    private void requireAdmin(AuthenticatedUser actor) {
        if (actor.getRole() != com.rwb.review.domain.Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator privileges required.");
        }
    }

    @Transactional(readOnly = true)
    public List<UserDtos.UserResponse> listPending() {
        return userRepository.findByAccountStatus(AccountStatus.PENDING_ADMIN_REVIEW)
                .stream().map(UserDtos.UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<UserDtos.UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserDtos.UserResponse::from).toList();
    }

    @Transactional
    public UserDtos.UserResponse approveUser(AuthenticatedUser actor, Long userId) {
        requireAdmin(actor);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        if (user.getAccountStatus() != AccountStatus.PENDING_ADMIN_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only registrations pending administrative review can be approved.");
        }
        // Lifecycle step 2 -> 3: awaiting the applicant's first project submission.
        user.setAccountStatus(AccountStatus.ACTIVE_FIRST_PROJECT_REQUIRED);
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_APPROVE", "Approved registration for " + user.getEmail());
        return UserDtos.UserResponse.from(user);
    }

    @Transactional
    public UserDtos.UserResponse rejectUser(AuthenticatedUser actor, Long userId) {
        requireAdmin(actor);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        if (user.getAccountStatus() != AccountStatus.PENDING_ADMIN_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only registrations pending administrative review can be rejected.");
        }
        user.setAccountStatus(AccountStatus.REJECTED);
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_REJECT", "Declined registration for " + user.getEmail());
        return UserDtos.UserResponse.from(user);
    }

    /** Admin creates an account directly — no registration lifecycle. */
    @Transactional
    public UserDtos.UserResponse createUser(AuthenticatedUser actor, UserDtos.AdminCreateUserRequest request) {
        requireAdmin(actor);
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        Role role = parseRole(request.role());
        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                findOrCreateOrganization(request.organizationName()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_CREATE_USER", "Created " + role + " account for " + email);
        return UserDtos.UserResponse.from(user);
    }

    /** Admin edits name, role, organization, and optionally resets the password. */
    @Transactional
    public UserDtos.UserResponse updateUser(AuthenticatedUser actor, Long userId, UserDtos.AdminUpdateUserRequest request) {
        requireAdmin(actor);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        Role role = parseRole(request.role());
        user.setFullName(request.fullName().trim());
        user.setRole(role);
        user.setOrganization(findOrCreateOrganization(request.organizationName()));
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_UPDATE_USER", "Updated account " + user.getEmail()
                + " (role=" + role + (request.password() != null && !request.password().isBlank() ? ", password reset" : "") + ")");
        return UserDtos.UserResponse.from(user);
    }

    /** Suspends an account without deleting it (login blocked until enabled). */
    @Transactional
    public UserDtos.UserResponse disableUser(AuthenticatedUser actor, Long userId) {
        requireAdmin(actor);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        if (userId.equals(actor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot disable your own account.");
        }
        ensureNotLastAdmin(user);
        user.setAccountStatus(AccountStatus.DISABLED);
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_DISABLE_USER", "Disabled account " + user.getEmail());
        return UserDtos.UserResponse.from(user);
    }

    /** Restores a disabled account to full access. */
    @Transactional
    public UserDtos.UserResponse enableUser(AuthenticatedUser actor, Long userId) {
        requireAdmin(actor);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
        auditLogger.log(actor.getEmail(), "ADMIN_ENABLE_USER", "Enabled account " + user.getEmail());
        return UserDtos.UserResponse.from(user);
    }

    /**
     * Hard-deletes an account with no dependants (projects, correspondence,
     * reviews). Accounts with dependants must be disabled instead.
     */
    @Transactional
    public void deleteUser(AuthenticatedUser actor, Long userId) {
        requireAdmin(actor);
        if (userId.equals(actor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own account.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        ensureNotLastAdmin(user);
        try {
            userRepository.delete(user);
            userRepository.flush(); // surface any FK violation here, inside the try
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this user — they own projects or have correspondence. Disable the account instead.");
        }
        auditLogger.log(actor.getEmail(), "ADMIN_DELETE_USER", "Deleted account " + user.getEmail());
    }

    private Role parseRole(String role) {
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown role: " + role);
        }
    }

    private Organization findOrCreateOrganization(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String trimmed = name.trim();
        return organizationRepository.findByName(trimmed)
                .orElseGet(() -> organizationRepository.save(new Organization(trimmed)));
    }

    /** Prevents disabling/deleting the only usable administrator. */
    private void ensureNotLastAdmin(User target) {
        if (target.getRole() != Role.ADMIN) {
            return;
        }
        long usableAdmins = userRepository.findByRole(Role.ADMIN).stream()
                .filter(u -> u.getAccountStatus() != AccountStatus.DISABLED)
                .count();
        if (usableAdmins <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot disable or delete the last active administrator.");
        }
    }

    @Transactional(readOnly = true)
    public MailDtos.MailStatusResponse mailStatus(AuthenticatedUser actor) {
        requireAdmin(actor);
        return mailService.status();
    }

    /** Sends a connectivity test message; the target address is never recorded. */
    @Transactional
    public MailDtos.MailTestResponse testMail(AuthenticatedUser actor, String to) {
        requireAdmin(actor);
        if (!mailService.isEnabled()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Mail delivery is disabled (app.mail.enabled=false). Enable it and set MAIL_HOST to send.");
        }
        mailService.sendTestEmail(to);
        auditLogger.log(actor.getEmail(), "MAIL_TEST", "Sent SMTP test message to " + to);
        return new MailDtos.MailTestResponse(true, "Test message sent to " + to + ".");
    }
}
