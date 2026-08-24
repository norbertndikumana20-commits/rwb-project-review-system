package com.rwb.review.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Serves admin-uploaded branding images (landing slideshow + auth background)
 * as public static resources. The security filter chain permits
 * {@code /branding-files/**} so unauthenticated pages can render them.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final Path brandingDir;

    public WebConfig(@Value("${app.uploads.dir:./uploads}") String uploadsDir) {
        this.brandingDir = Path.of(uploadsDir, "branding").toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/branding-files/**")
                .addResourceLocations(brandingDir.toUri().toString());
    }
}
