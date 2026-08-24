package com.rwb.review.security;

import com.rwb.review.domain.AccountStatus;
import com.rwb.review.domain.Role;
import com.rwb.review.domain.User;
import com.rwb.review.service.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Principal stored in the SecurityContext by {@link JwtAuthFilter}.
 */
public class AuthenticatedUser {

    private final Long id;
    private final String email;
    private final String fullName;
    private final Role role;
    private final AccountStatus accountStatus;

    public AuthenticatedUser(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole();
        this.accountStatus = user.getAccountStatus();
    }

    public static AuthenticatedUser current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser user) {
            return user;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public Role getRole() {
        return role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }
}
