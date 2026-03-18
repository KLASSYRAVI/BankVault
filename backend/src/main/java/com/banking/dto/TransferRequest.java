package com.banking.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransferRequest {
    @NotNull(message = "Source account is required")
    private UUID fromAccountId;

    @NotNull(message = "Destination account is required")
    private UUID toAccountId;

    @DecimalMin(value = "0.01", message = "Transfer amount must be greater than 0")
    @DecimalMax(value = "10000.00", message = "Transfer amount exceeds daily limit")
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @Size(max = 255, message = "Description must be less than 255 characters")
    private String description;

    @NotBlank(message = "Idempotency key is required")
    private String idempotencyKey;
}
