package com.learnix.service;

import com.learnix.dto.UserDto;
import com.learnix.exception.ResourceNotFoundException;
import com.learnix.model.User;
import com.learnix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public UserDto registerUser(User user) {
        String normalizedEmail = normalizeEmail(user.getEmail());
        user.setEmail(normalizedEmail);

        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUser.isPresent()) {
            return mapToDto(existingUser.get());
        }

        // In a real app, hash password here
        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    public UserDto loginUser(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(normalizeEmail(email));
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword() != null && user.getPassword().equals(password)) {
                return mapToDto(user);
            }
        }
        return null;
    }

    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToDto(user);
    }

    public void updateStudyTime(Long userId, Long additionalTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setTotalStudyTime(user.getTotalStudyTime() + additionalTime);
        userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setGrade(user.getGrade());
        dto.setStatus(user.getStatus());
        dto.setTotalStudyTime(user.getTotalStudyTime());
        return dto;
    }
}
