package com.rwb.review.service;

import com.rwb.review.domain.BrandingImage;
import com.rwb.review.domain.Role;
import com.rwb.review.dto.BrandingDtos;
import com.rwb.review.repo.BrandingRepository;
import com.rwb.review.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BrandingService {

    public static final String KIND_LANDING = "LANDING";
    public static final String KIND_AUTH = "AUTH";

    /** Only raster image types make sense for slideshows/backgrounds. */
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final BrandingRepository brandingRepository;
    private final AuditLogger auditLogger;
    private final Path brandingDir;

    public BrandingService(BrandingRepository brandingRepository,
                           AuditLogger auditLogger,
                           @Value("${app.uploads.dir:./uploads}") String uploadsDir) {
        this.brandingRepository = brandingRepository;
        this.auditLogger = auditLogger;
        this.brandingDir = Path.of(uploadsDir, "branding");
    }

    private void requireAdmin(AuthenticatedUser actor) {
        if (actor.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator privileges required.");
        }
    }

    private String requireKind(String kind) {
        String k = kind == null || kind.isBlank() ? KIND_LANDING : kind.trim().toUpperCase();
        if (!k.equals(KIND_LANDING) && !k.equals(KIND_AUTH)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "slideKind must be LANDING or AUTH.");
        }
        return k;
    }

    /** Admin uploads a branding image; lands at the end of its kind's order. */
    @Transactional
    public BrandingDtos.BrandingImageResponse upload(AuthenticatedUser actor, MultipartFile file,
                                                     String slideKind, String caption) {
        requireAdmin(actor);
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No image file was provided.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type. Upload a JPEG, PNG, WebP or GIF image.");
        }
        String kind = requireKind(slideKind);
        String original = file.getOriginalFilename();
        String safeName = original == null || original.isBlank()
                ? "branding-image"
                : Paths.get(original).getFileName().toString();
        try {
            Files.createDirectories(brandingDir);
            String key = UUID.randomUUID() + "_" + safeName;
            Files.copy(file.getInputStream(), brandingDir.resolve(key), StandardCopyOption.REPLACE_EXISTING);

            int sortOrder = brandingRepository.findAll().stream()
                    .mapToInt(BrandingImage::getSortOrder)
                    .max().orElse(0) + 1;
            String cleanCaption = caption == null ? null : caption.trim();
            BrandingImage image = new BrandingImage(
                    safeName, contentType, file.getSize(), key, kind, sortOrder);
            image.setCaption(cleanCaption == null || cleanCaption.isBlank() ? null : cleanCaption);
            brandingRepository.save(image);
            auditLogger.log(actor.getEmail(), "BRANDING_UPLOAD",
                    "Uploaded " + safeName + " (" + kind + ", " + file.getSize() + " bytes)");
            return BrandingDtos.BrandingImageResponse.from(image);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store the image: " + e.getMessage());
        }
    }

    /** Public list — active images only, no authentication required. */
    @Transactional(readOnly = true)
    public List<BrandingDtos.BrandingImageResponse> listPublic(String slideKind) {
        String kind = requireKind(slideKind);
        return brandingRepository.findByActiveTrueAndSlideKindOrderBySortOrderAscCreatedAtAsc(kind)
                .stream().map(BrandingDtos.BrandingImageResponse::from).toList();
    }

    /** Admin list — everything, including inactive images. */
    @Transactional(readOnly = true)
    public List<BrandingDtos.BrandingImageResponse> listAll(AuthenticatedUser actor, String slideKind) {
        requireAdmin(actor);
        String kind = requireKind(slideKind);
        return brandingRepository.findBySlideKindOrderBySortOrderAscCreatedAtAsc(kind)
                .stream().map(BrandingDtos.BrandingImageResponse::from).toList();
    }

    /** Admin edits caption, kind, order, or visibility. */
    @Transactional
    public BrandingDtos.BrandingImageResponse update(AuthenticatedUser actor, Long id,
                                                     BrandingDtos.BrandingUpdateRequest request) {
        requireAdmin(actor);
        BrandingImage image = findImage(id);
        if (request.caption() != null) {
            String caption = request.caption().trim();
            image.setCaption(caption.isBlank() ? null : caption);
        }
        if (request.slideKind() != null) {
            image.setSlideKind(requireKind(request.slideKind()));
        }
        if (request.sortOrder() != null) {
            image.setSortOrder(request.sortOrder());
        }
        if (request.active() != null) {
            image.setActive(request.active());
        }
        brandingRepository.save(image);
        auditLogger.log(actor.getEmail(), "BRANDING_UPDATE",
                "Updated branding image " + image.getFileName() + " (#" + image.getId() + ")");
        return BrandingDtos.BrandingImageResponse.from(image);
    }

    /** Admin deletes an image (row + bytes on disk). */
    @Transactional
    public void delete(AuthenticatedUser actor, Long id) {
        requireAdmin(actor);
        BrandingImage image = findImage(id);
        brandingRepository.delete(image);
        try {
            Files.deleteIfExists(brandingDir.resolve(image.getStorageKey()));
        } catch (IOException ignored) {
            // Row removal is authoritative; a leftover file is harmless.
        }
        auditLogger.log(actor.getEmail(), "BRANDING_DELETE",
                "Deleted branding image " + image.getFileName() + " (#" + image.getId() + ")");
    }

    private BrandingImage findImage(Long id) {
        return brandingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Branding image not found."));
    }
}
