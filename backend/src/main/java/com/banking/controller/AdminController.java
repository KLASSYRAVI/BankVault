package com.banking.controller;

import com.banking.domain.User;
import com.banking.dto.ApiResponse;
import com.banking.dto.TransactionFilterRequest;
import com.banking.dto.TransactionResponse;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.service.TransactionService;
import com.banking.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(), "Users retrieved"));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable UUID id, @RequestParam boolean active) {
        userService.updateUserStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success(null, "User status updated"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getAllTransactions(
            @ModelAttribute TransactionFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getAllHistory(filter), "All transactions"));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        ZonedDateTime startOfDay = ZonedDateTime.now().toLocalDate().atStartOfDay(ZonedDateTime.now().getZone());

        long totalAccounts = accountRepository.countTotalAccounts();
        BigDecimal volumeToday = transactionRepository.sumVolumeSince(startOfDay);
        long failedCount = transactionRepository.countFailedTransactionsSince(startOfDay);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAccounts", totalAccounts);
        stats.put("volumeToday", volumeToday != null ? volumeToday : BigDecimal.ZERO);
        stats.put("failedCountToday", failedCount);

        return ResponseEntity.ok(ApiResponse.success(stats, "Dashboard stats"));
    }
}
