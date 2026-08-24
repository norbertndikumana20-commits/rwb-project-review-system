package com.rwb.review.repo;

import com.rwb.review.domain.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Long> {
    Optional<AppSettings> findByKey(String key);
}
