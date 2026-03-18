package com.banking.dto;

import com.banking.domain.enums.TransactionType;
import com.banking.domain.enums.TransactionStatus;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionFilterRequest {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;


    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    private TransactionType type;
    private TransactionStatus status;

    private int page = 0;
    private int size = 20;
}
