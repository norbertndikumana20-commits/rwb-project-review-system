package com.rwb.review.repo;

import com.rwb.review.domain.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByProjectIdOrderByCreatedAtAsc(Long projectId);

    long countByProjectIdAndFileName(Long projectId, String fileName);
}
