package com.rwb.review.service;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Application-level mail settings (sender identity + behavior), layered on top
 * of Spring Boot's standard {@code spring.mail.*} SMTP transport properties.
 * All values are environment-overridable (see application.yml).
 */
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    /** Master switch. When false the API returns the token directly (dev mode). */
    private boolean enabled;

    /** Sender address used as the From header. */
    private String from = "no-reply@rwb.example";

    /** Sender display name. */
    private String displayName = "RWB Project Review";

    /** Frontend verification page; "?token=..." is appended to build the link. */
    private String verifyUrl = "http://localhost:5173/verify-email";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getVerifyUrl() {
        return verifyUrl;
    }

    public void setVerifyUrl(String verifyUrl) {
        this.verifyUrl = verifyUrl;
    }
}
