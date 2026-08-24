package com.rwb.review.repo;

import com.rwb.review.domain.BrandingImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandingRepository extends JpaRepository<BrandingImage, Long> {

    /** Public surface: only active images, in display order. */
    List<BrandingImage> findByActiveTrueAndSlideKindOrderBySortOrderAscCreatedAtAsc(String slideKind);

    /** Admin surface: everything of a kind, in display order. */
    List<BrandingImage> findBySlideKindOrderBySortOrderAscCreatedAtAsc(String slideKind);
}
