package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.TransactionFilterRequest;
import com.banking.dto.TransactionResponse;
import com.banking.dto.TransferRequest;
import com.banking.service.FundTransferService;
import com.banking.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final FundTransferService fundTransferService;
    private final TransactionService transactionService;

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @Valid @RequestBody TransferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TransactionResponse response = fundTransferService.transferFunds(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Transfer successful"));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactions(
            @PathVariable UUID accountId,
            @ModelAttribute TransactionFilterRequest filter,
            @AuthenticationPrincipal UserDetails userDetails) {
        Page<TransactionResponse> transactions = transactionService.getHistory(accountId, filter, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(transactions, "Transactions retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getById(id), "Transaction retrieved"));
    }

    @GetMapping("/account/{accountId}/export")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable UUID accountId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String csv = transactionService.exportToCsv(accountId, userDetails.getUsername());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transactions.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes());
    }
}
