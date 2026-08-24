package com.rwb.review.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rwb.review.domain.AccountStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Account-lifecycle gate (SRS v2.1). Users who are not {@code ACTIVE} may only
 * reach the auth routes, their own profile, and — only when
 * {@code ACTIVE_FIRST_PROJECT_REQUIRED} — the project submission endpoint.
 * Everything else is rejected with 403, regardless of role.
 */
@Component
public class FirstProjectGateFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            AccountStatus status = user.getAccountStatus();
            if (status != AccountStatus.ACTIVE) {
                String path = request.getRequestURI();
                boolean authRoute = path.startsWith("/api/auth");
                boolean meRoute = path.equals("/api/me");
                // First-project users may file the docket and attach its files
                // (account flips to ACTIVE once the docket is created), and may
                // message RWB staff while their account is being set up.
                boolean firstProject =
                        status == AccountStatus.ACTIVE_FIRST_PROJECT_REQUIRED
                                && (("/api/projects".equals(path) || path.startsWith("/api/projects/"))
                                        && "POST".equalsIgnoreCase(request.getMethod())
                                || path.startsWith("/api/messages")
                                || path.startsWith("/api/directory"));
                if (authRoute || meRoute || firstProject) {
                    chain.doFilter(request, response);
                    return;
                }
                writeForbidden(response, status);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private void writeForbidden(HttpServletResponse response, AccountStatus status) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String message = switch (status) {
            case PENDING_EMAIL_VERIFICATION -> "Email verification required.";
            case PENDING_ADMIN_REVIEW -> "Registration pending administrative review.";
            case ACTIVE_FIRST_PROJECT_REQUIRED ->
                    "A first project must be submitted before accessing the review system.";
            case REJECTED -> "Registration was declined by administration.";
            case DISABLED -> "This account has been disabled. Contact your administrator.";
            default -> "Access requires an ACTIVE account.";
        };
        objectMapper.writeValue(response.getWriter(), Map.of(
                "status", HttpServletResponse.SC_FORBIDDEN,
                "message", message));
    }
}
