package com.rwb.review.web;

import com.rwb.review.domain.AppSettings;
import com.rwb.review.dto.AppSettingsDtos;
import com.rwb.review.repo.AppSettingsRepository;
import com.rwb.review.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
public class AppSettingsController {

    private final AppSettingsRepository repo;

    public AppSettingsController(AppSettingsRepository repo) {
        this.repo = repo;
    }

    /** Returns every setting as a flat key→value map. */
    @GetMapping
    public ResponseEntity<AppSettingsDtos.SettingsResponse> get() {
        AuthenticatedUser.current(); // must be authenticated
        Map<String, String> map = new LinkedHashMap<>();
        repo.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return ResponseEntity.ok(new AppSettingsDtos.SettingsResponse(map));
    }

    /** Batch upsert: each key in the map is created or updated. */
    @PutMapping
    @Transactional
    public ResponseEntity<AppSettingsDtos.SettingsResponse> update(
            @RequestBody AppSettingsDtos.UpdateSettingsRequest body) {
        AuthenticatedUser.current();
        for (Map.Entry<String, String> entry : body.settings().entrySet()) {
            String key = entry.getKey().trim();
            String value = entry.getValue();
            if (key.isBlank() || value == null) continue;
            AppSettings setting = repo.findByKey(key).orElse(new AppSettings(key, value.trim()));
            setting.setValue(value.trim());
            repo.save(setting);
        }
        Map<String, String> map = new LinkedHashMap<>();
        repo.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return ResponseEntity.ok(new AppSettingsDtos.SettingsResponse(map));
    }

    /** Delete a single setting by key. */
    @DeleteMapping("/{key}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable String key) {
        AuthenticatedUser.current();
        repo.findByKey(key).ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }
}
