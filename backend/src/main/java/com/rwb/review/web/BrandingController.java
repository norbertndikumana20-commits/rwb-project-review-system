package com.rwb.review.web;

import com.rwb.review.dto.BrandingDtos;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.BrandingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class BrandingController {

    private final BrandingService brandingService;

    public BrandingController(BrandingService brandingService) {
        this.brandingService = brandingService;
    }

    /** Public: active images for rendering on /, /signin and /register. */
    @GetMapping("/api/branding")
    public List<BrandingDtos.BrandingImageResponse> publicList(
            @RequestParam(defaultValue = "LANDING") String kind) {
        return brandingService.listPublic(kind);
    }

    /** Admin: upload a new branding image (multipart: file, kind, caption). */
    @PostMapping("/api/admin/branding")
    @ResponseStatus(HttpStatus.CREATED)
    public BrandingDtos.BrandingImageResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "LANDING") String kind,
            @RequestParam(required = false) String caption) {
        return brandingService.upload(AuthenticatedUser.current(), file, kind, caption);
    }

    /** Admin: everything of a kind, including inactive images. */
    @GetMapping("/api/admin/branding")
    public List<BrandingDtos.BrandingImageResponse> adminList(
            @RequestParam(defaultValue = "LANDING") String kind) {
        return brandingService.listAll(AuthenticatedUser.current(), kind);
    }

    /** Admin: edit caption, kind, order, or visibility. */
    @PatchMapping("/api/admin/branding/{id}")
    public BrandingDtos.BrandingImageResponse update(@PathVariable Long id,
                                                     @Valid @RequestBody BrandingDtos.BrandingUpdateRequest request) {
        return brandingService.update(AuthenticatedUser.current(), id, request);
    }

    /** Admin: delete an image. */
    @DeleteMapping("/api/admin/branding/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        brandingService.delete(AuthenticatedUser.current(), id);
    }
}
