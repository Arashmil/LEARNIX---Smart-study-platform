package com.learnix.controller;

import com.learnix.dto.AuthResponse;
import com.learnix.dto.LoginRequest;
import com.learnix.dto.UserDto;
import com.learnix.model.User;
import com.learnix.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody User user) {
        UserDto registeredUser = userService.registerUser(user);
        return ResponseEntity.ok(new AuthResponse("User registered successfully", registeredUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        UserDto user = userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
        if (user != null) {
            return ResponseEntity.ok(new AuthResponse("Login successful", user));
        }
        return ResponseEntity.status(401).body(new AuthResponse("Invalid credentials", null));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new AuthResponse("Account deleted successfully", null));
    }
}
