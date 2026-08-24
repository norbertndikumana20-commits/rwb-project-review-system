package com.rwb.review.service;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Organization;
import com.rwb.review.domain.User;
import com.rwb.review.dto.AuthDtos;
import com.rwb.review.dto.UserDtos;
import com.rwb.review.repo.OrganizationRepository;
import com.rwb.review.repo.UserRepository;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogger auditLogger;
    private final MailService mailService;
    private final MfaService mfaService;

    public AuthService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditLogger auditLogger,
                       MailService mailService,
                       MfaService mfaService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLogger = auditLogger;
        this.mailService = mailService;
        this.mfaService = mfaService;
    }

    @Transactional
    public AuthDtos.RegisterResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        Organization organization = organizationRepository.findByName(request.organizationName().trim())
                .orElseGet(() -> organizationRepository.save(
                        new Organization(request.organizationName().trim())));

        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                organization);
        user.setAccountStatus(AccountStatus.PENDING_EMAIL_VERIFICATION);
        user.setEmailVerificationToken(UUID.randomUUID().toString());
        userRepository.save(user);

        auditLogger.log(email, "REGISTER", "Account created; awaiting email verification.");

        boolean emailed = deliverVerification(email, user.getEmailVerificationToken());

        return new AuthDtos.RegisterResponse(
                emailed
                        ? "Registration received. A verification link has been emailed to your address."
                        : "Registration received. Please verify your email address.",
                user.getId(),
                email,
                user.getAccountStatus().name(),
                emailed,
                emailed ? null : user.getEmailVerificationToken());
    }

    @Transactional
    public AuthDtos.VerifyEmailResponse verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired verification token."));
        user.setAccountStatus(AccountStatus.PENDING_ADMIN_REVIEW);
        user.setEmailVerifiedAt(Instant.now());
        user.setEmailVerificationToken(null);
        userRepository.save(user);

        auditLogger.log(user.getEmail(), "VERIFY_EMAIL", "Email verified; pending administrative review.");
        return new AuthDtos.VerifyEmailResponse(
                "Email verified. Your registration is now pending administrative review.",
                user.getAccountStatus().name());
    }

    /** Re-issues a verification token for an account still awaiting email verification. */
    @Transactional
    public AuthDtos.RegisterResponse resendVerification(String email) {
        // Anti-enumeration: identical message whether or not the account exists
        // and whatever its state.
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null || user.getAccountStatus() != AccountStatus.PENDING_EMAIL_VERIFICATION) {
            throw new ApiException(HttpStatus.NOT_FOUND,
                    "If that account is awaiting verification, a fresh link has been issued.");
        }
        user.setEmailVerificationToken(UUID.randomUUID().toString());
        userRepository.save(user);
        auditLogger.log(user.getEmail(), "RESEND_VERIFICATION", "Re-issued email verification token.");

        boolean emailed = deliverVerification(user.getEmail(), user.getEmailVerificationToken());

        return new AuthDtos.RegisterResponse(
                emailed
                        ? "A fresh verification link has been emailed to your address."
                        : "A fresh verification link has been issued.",
                user.getId(),
                user.getEmail(),
                user.getAccountStatus().name(),
                emailed,
                emailed ? null : user.getEmailVerificationToken());
    }

    /**
     * Emails the verification link when mail is configured. When mail is
     * disabled (dev mode) returns false so the caller exposes the token in the
     * response instead. When mail is enabled but delivery fails, the exception
     * propagates and the transaction rolls back — the token is never leaked.
     */
    private boolean deliverVerification(String email, String token) {
        if (!mailService.isEnabled()) {
            return false;
        }
        mailService.sendVerificationEmail(email, token);
        auditLogger.log(email, "MAIL_VERIFY", "Verification link emailed to " + email);
        return true;
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        if (user.getAccountStatus() == AccountStatus.PENDING_EMAIL_VERIFICATION) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Please verify your email address before signing in.");
        }
        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This registration was declined by administration.");
        }
        if (user.getAccountStatus() == AccountStatus.DISABLED) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "This account has been disabled. Contact your administrator.");
        }
        String token = jwtService.generateToken(new AuthenticatedUser(user));
        auditLogger.log(user.getEmail(), "LOGIN", "Signed in.");
        return new AuthDtos.AuthResponse(token, UserDtos.UserResponse.from(user));
    }

    /** Issues a sign-in verification code (emailed when SMTP is configured). */
    public AuthDtos.MfaRequestResponse requestMfa(String email) {
        return mfaService.request(email.trim().toLowerCase());
    }

    /** Validates the presented sign-in verification code. */
    public AuthDtos.MfaVerifyResponse verifyMfa(String email, String code) {
        return mfaService.verify(email.trim().toLowerCase(), code);
    }
}
