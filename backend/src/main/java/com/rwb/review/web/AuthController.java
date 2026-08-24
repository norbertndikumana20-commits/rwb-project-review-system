package com.rwb.review.web;

import com.rwb.review.dto.AuthDtos;
import com.rwb.review.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.RegisterResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/verify")
    public AuthDtos.VerifyEmailResponse verify(@RequestParam("token") String token) {
        return authService.verifyEmail(token);
    }

    @PostMapping("/resend")
    public AuthDtos.RegisterResponse resend(@Valid @RequestBody AuthDtos.ResendRequest request) {
        return authService.resendVerification(request.email());
    }

    @PostMapping("/mfa/request")
    public AuthDtos.MfaRequestResponse mfaRequest(@Valid @RequestBody AuthDtos.MfaRequest request) {
        return authService.requestMfa(request.email());
    }

    @PostMapping("/mfa/verify")
    public AuthDtos.MfaVerifyResponse mfaVerify(@Valid @RequestBody AuthDtos.MfaVerifyRequest request) {
        return authService.verifyMfa(request.email(), request.code());
    }
}
