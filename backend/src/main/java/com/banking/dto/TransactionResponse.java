package com.banking.dto;

import com.banking.domain.enums.TransactionStatus;
import com.banking.domain.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID id;
    private UUID fromAccountId;
    private UUID toAccountId;
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private TransactionType type;
    private String transactionType;
    private TransactionStatus status;
    private String referenceId;
    private String description;
    private ZonedDateTime createdAt;
    private ZonedDateTime completedAt;
}
