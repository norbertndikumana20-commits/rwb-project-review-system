package com.rwb.review.repo;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailVerificationToken(String token);

    List<User> findByAccountStatus(AccountStatus accountStatus);

    List<User> findByRole(Role role);

    boolean existsByEmail(String email);
}
