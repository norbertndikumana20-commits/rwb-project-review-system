package com.rwb.review.web;

import com.rwb.review.dto.MailDtos;
import com.rwb.review.dto.UserDtos;
import com.rwb.review.security.AuthenticatedUser;
import com.rwb.review.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users/pending")
    public List<UserDtos.UserResponse> pending() {
        return adminService.listPending();
    }

    @GetMapping("/users")
    public List<UserDtos.UserResponse> users() {
        return adminService.listUsers();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDtos.UserResponse createUser(@Valid @RequestBody UserDtos.AdminCreateUserRequest request) {
        return adminService.createUser(AuthenticatedUser.current(), request);
    }

    @PutMapping("/users/{id}")
    public UserDtos.UserResponse updateUser(@PathVariable Long id,
                                            @Valid @RequestBody UserDtos.AdminUpdateUserRequest request) {
        return adminService.updateUser(AuthenticatedUser.current(), id, request);
    }

    @PostMapping("/users/{id}/disable")
    public UserDtos.UserResponse disable(@PathVariable Long id) {
        return adminService.disableUser(AuthenticatedUser.current(), id);
    }

    @PostMapping("/users/{id}/enable")
    public UserDtos.UserResponse enable(@PathVariable Long id) {
        return adminService.enableUser(AuthenticatedUser.current(), id);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(AuthenticatedUser.current(), id);
    }

    @PostMapping("/users/{id}/approve")
    public UserDtos.UserResponse approve(@PathVariable Long id) {
        return adminService.approveUser(AuthenticatedUser.current(), id);
    }

    @PostMapping("/users/{id}/reject")
    public UserDtos.UserResponse reject(@PathVariable Long id) {
        return adminService.rejectUser(AuthenticatedUser.current(), id);
    }

    @GetMapping("/mail/status")
    public MailDtos.MailStatusResponse mailStatus() {
        return adminService.mailStatus(AuthenticatedUser.current());
    }

    @PostMapping("/mail/test")
    public MailDtos.MailTestResponse mailTest(@Valid @RequestBody MailDtos.MailTestRequest request) {
        return adminService.testMail(AuthenticatedUser.current(), request.to());
    }
}
