package com.banking.service;

import com.banking.domain.User;
import com.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void updateUserStatus(java.util.UUID userId, boolean active) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setActive(active);
        userRepository.save(user);
    }
}
