package com.rwb.review.repo;

import com.rwb.review.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProjectIdOrderByCreatedAtAsc(Long projectId);
}
