package com.rwb.review.service;

import com.rwb.review.dto.MailDtos;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends verification emails through the configured SMTP transport.
 * <p>
 * When {@code app.mail.enabled} is false (the default), the caller is expected
 * to fall back to returning the verification token in the API response — no
 * mail transport is required at all.
 */
@Service
public class MailService {

    private final MailProperties props;
    private final ObjectProvider<JavaMailSender> senderProvider;
    private final String smtpHost;
    private final int smtpPort;

    public MailService(MailProperties props,
                       ObjectProvider<JavaMailSender> senderProvider,
                       @Value("${spring.mail.host:}") String smtpHost,
                       @Value("${spring.mail.port:587}") int smtpPort) {
        this.props = props;
        this.senderProvider = senderProvider;
        this.smtpHost = smtpHost == null ? "" : smtpHost.trim();
        this.smtpPort = smtpPort;
    }

    public boolean isEnabled() {
        return props.isEnabled();
    }

    /** True when mail is enabled AND an SMTP host has been configured. */
    public boolean isConfigured() {
        return isEnabled() && !smtpHost.isEmpty();
    }

    /**
     * Sends the email-verification message containing a clickable link.
     *
     * @throws ApiException if mail is enabled but delivery fails — the caller
     *                      must then refuse to leak the token.
     */
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = props.getVerifyUrl() + "?token=" + token;
        String subject = "RWB Project Review — verify your email address";
        String body = """
                RWB Project Review System

                Your registration for the review body has been received. To verify
                this email address and continue your application, open the link below:

                %s

                If the link does not open, paste this verification code into the
                verification page:

                %s

                This link is single-use and expires once used. If you did not
                register for RWB, you can ignore this message.
                """.formatted(verifyLink, token);
        send(to, subject, body);
    }

    /** Sends the 6-digit sign-in verification code. */
    public void sendMfaCodeEmail(String to, String code) {
        String subject = "RWB Project Review — your sign-in verification code";
        String body = """
                RWB Project Review System

                Your sign-in verification code is:

                %s

                Enter it in the verification step to finish signing in. The code
                expires in 10 minutes. If you did not try to sign in, you can
                ignore this message.
                """.formatted(code);
        send(to, subject, body);
    }

    /** Sends a connectivity test message to an administrator-provided address. */
    public void sendTestEmail(String to) {
        String subject = "RWB Project Review — SMTP test";
        String body = """
                This is a test message from the RWB Project Review System.

                If you received it, the configured mail transport is working and
                verification emails will be delivered to this address.
                """;
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Mail is enabled but no JavaMailSender is available. Check spring.mail.* configuration.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(props.getFrom());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(message);
        } catch (MailException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Verification email could not be sent: " + e.getMessage());
        }
    }

    /** Redacted status for the admin panel. */
    public MailDtos.MailStatusResponse status() {
        return new MailDtos.MailStatusResponse(
                isEnabled(),
                props.getFrom(),
                props.getDisplayName(),
                props.getVerifyUrl(),
                smtpHost,
                smtpPort,
                isConfigured());
    }
}
