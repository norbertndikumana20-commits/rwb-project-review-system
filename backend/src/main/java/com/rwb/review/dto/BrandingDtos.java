package com.rwb.review.dto;

import com.rwb.review.domain.BrandingImage;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class BrandingDtos {

    private BrandingDtos() {
    }

    public record BrandingImageResponse(
            Long id,
            String fileName,
            String contentType,
            long sizeBytes,
            /** Publicly renderable URL, e.g. /branding-files/<key>. */
            String url,
            String slideKind,
            String caption,
            int sortOrder,
            boolean active,
            Instant createdAt) {

        public static BrandingImageResponse from(BrandingImage image) {
            return new BrandingImageResponse(
                    image.getId(),
                    image.getFileName(),
                    image.getContentType(),
                    image.getSizeBytes(),
                    "/branding-files/" + image.getStorageKey(),
                    image.getSlideKind(),
                    image.getCaption(),
                    image.getSortOrder(),
                    image.isActive(),
                    image.getCreatedAt());
        }
    }

    /** Admin edits caption, kind, order, or visibility. All fields optional. */
    public record BrandingUpdateRequest(
            @Size(max = 255) String caption,
            @Size(max = 16) String slideKind,
            Integer sortOrder,
            Boolean active) {
    }
}
