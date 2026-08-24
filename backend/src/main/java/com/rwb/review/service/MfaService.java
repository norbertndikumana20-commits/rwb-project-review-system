package com.rwb.review.service;

import com.rwb.review.dto.AuthDtos;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Second-factor sign-in codes (6 digits, 10-minute lifetime).
 * <p>
 * When SMTP is configured the code is emailed to the account; otherwise a
 * dev code is returned in the response so the flow stays testable without a
 * mail transport (mirrors the verification-token fallback).
 */
@Service
public class MfaService {

    private static final int CODE_TTL_SECONDS = 600;
    private static final int MAX_ATTEMPTS = 5;

    private final SecureRandom random = new SecureRandom();
    private final MailService mailService;
    private final AuditLogger auditLogger;
    private final Map<String, MfaEntry> codes = new ConcurrentHashMap<>();

    public MfaService(MailService mailService, AuditLogger auditLogger) {
        this.mailService = mailService;
        this.auditLogger = auditLogger;
    }

    /** Issues a fresh 6-digit code for the account and (when possible) emails it. */
    public AuthDtos.MfaRequestResponse request(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        codes.put(email, new MfaEntry(code, Instant.now().plusSeconds(CODE_TTL_SECONDS), 0));

        boolean emailed = false;
        if (mailService.isConfigured()) {
            mailService.sendMfaCodeEmail(email, code);
            emailed = true;
            auditLogger.log(email, "MFA_REQUEST", "Sign-in verification code emailed.");
        } else {
            auditLogger.log(email, "MFA_REQUEST", "Sign-in verification code issued (dev mode).");
        }
        return new AuthDtos.MfaRequestResponse(emailed, emailed ? null : code);
    }

    /** Validates the presented code, allowing {@value #MAX_ATTEMPTS} tries. */
    public AuthDtos.MfaVerifyResponse verify(String email, String code) {
        MfaEntry entry = codes.get(email);
        if (entry == null) {
            return new AuthDtos.MfaVerifyResponse(false,
                    "No active code for this account. Request a new one.");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            codes.remove(email);
            return new AuthDtos.MfaVerifyResponse(false,
                    "That code has expired. Request a new one.");
        }
        if (entry.attempts() >= MAX_ATTEMPTS) {
            codes.remove(email);
            return new AuthDtos.MfaVerifyResponse(false,
                    "Too many incorrect attempts. Request a new code.");
        }
        if (!entry.code().equals(code.trim())) {
            codes.put(email, entry.withAttempts(entry.attempts() + 1));
            return new AuthDtos.MfaVerifyResponse(false, "Incorrect code. Please try again.");
        }
        codes.remove(email);
        auditLogger.log(email, "MFA_VERIFY", "Sign-in verification code accepted.");
        return new AuthDtos.MfaVerifyResponse(true, "Verified.");
    }

    private record MfaEntry(String code, Instant expiresAt, int attempts) {
        MfaEntry withAttempts(int n) {
            return new MfaEntry(code, expiresAt, n);
        }
    }
}
