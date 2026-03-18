package com.banking.controller;

import com.banking.domain.Account;
import com.banking.domain.enums.AccountType;
import com.banking.dto.ApiResponse;
import com.banking.dto.AccountLookupResponse;
import com.banking.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/lookup")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AccountLookupResponse> lookupAccount(
            @RequestParam String accountNumber,
            org.springframework.security.core.Authentication auth) {
        AccountLookupResponse response = accountService.lookupAccount(accountNumber);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> closeAccount(
            @PathVariable UUID id,
            org.springframework.security.core.Authentication auth) {
        accountService.closeAccount(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Account closed"));
    }


    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Account>>> getMyAccounts(@AuthenticationPrincipal UserDetails userDetails) {
        List<Account> accounts = accountService.getAccountsByUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(accounts, "Accounts retrieved"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Account>> createAccount(@AuthenticationPrincipal UserDetails userDetails,
            @RequestParam AccountType type) {
        Account account = accountService.createAccount(userDetails.getUsername(), type);
        return ResponseEntity.ok(ApiResponse.success(account, "Account created"));
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getBalance(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        BigDecimal balance = accountService.getBalance(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(balance, "Balance retrieved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable UUID id) {
        accountService.deactivateAccount(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Account deactivated"));
    }
}
