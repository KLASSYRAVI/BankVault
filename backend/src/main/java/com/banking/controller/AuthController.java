package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.AuthResponse;
import com.banking.dto.LoginRequest;
import com.banking.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final JwtTokenProvider tokenProvider;

        @PostMapping("/login")
        public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
                System.out.println("Login attempt for user: " + request.getUsername());
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String accessToken = tokenProvider.generateToken(userDetails);
                String refreshToken = tokenProvider.generateRefreshToken(userDetails.getUsername());

                String role = userDetails.getAuthorities().stream()
                                .findFirst()
                                .map(GrantedAuthority::getAuthority)
                                .orElse("ROLE_CUSTOMER");

                AuthResponse authResponse = AuthResponse.builder()
                                .accessToken(accessToken)
                                .username(userDetails.getUsername())
                                .role(role)
                                .build();

                ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                                .httpOnly(true)
                                .secure(false) // false for localhost dev
                                .path("/")
                                .maxAge(7 * 24 * 60 * 60)
                                .build();

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(ApiResponse.success(authResponse, "Login successful"));
        }

        @PostMapping("/refresh-token")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                        @CookieValue(name = "refreshToken", required = false) String refreshToken) {
                if (refreshToken != null && tokenProvider.validateToken(refreshToken)) {
                        String username = tokenProvider.extractUsername(refreshToken);

                        // In a real app we'd load UserDetails from DB here.
                        // Using a shortcut for the generated token subject
                        String newAccessToken = tokenProvider.generateToken(
                                        org.springframework.security.core.userdetails.User.withUsername(username)
                                                        .password("")
                                                        .authorities("ROLE_CUSTOMER") // Assuming role, should be
                                                                                      // fetched
                                                        .build());

                        AuthResponse authResponse = AuthResponse.builder()
                                        .accessToken(newAccessToken)
                                        .username(username)
                                        .build();

                        return ResponseEntity.ok(ApiResponse.success(authResponse, "Token refreshed"));
                } else {
                        return ResponseEntity.status(401).body(ApiResponse.error("Invalid or missing refresh token"));
                }
        }

        @PostMapping("/logout")
        public ResponseEntity<ApiResponse<Void>> logout() {
                ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                                .httpOnly(true)
                                .secure(false)
                                .path("/")
                                .maxAge(0)
                                .build();

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(ApiResponse.success(null, "Logged out successfully"));
        }
}
