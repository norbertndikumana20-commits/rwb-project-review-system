package com.rwb.review.dto;

import java.util.Map;

public final class AppSettingsDtos {
    private AppSettingsDtos() {}

    /** Full settings snapshot returned to the admin. */
    public record SettingsResponse(Map<String, String> settings) {}

    /** Batch-update request: key → new value. */
    public record UpdateSettingsRequest(Map<String, String> settings) {}
}
