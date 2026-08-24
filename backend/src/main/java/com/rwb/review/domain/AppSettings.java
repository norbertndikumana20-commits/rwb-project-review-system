package com.rwb.review.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Global application settings stored as key-value pairs.
 * The admin reads and writes these through {@code /admin/settings}.
 */
@Entity
@Table(name = "app_settings")
public class AppSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String key;

    @Column(nullable = false, length = 2000)
    private String value;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected AppSettings() {}

    public AppSettings(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public Long getId() { return id; }
    public String getKey() { return key; }
    public String getValue() { return value; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setValue(String value) {
        this.value = value;
        this.updatedAt = Instant.now();
    }
}
