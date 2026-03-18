package com.banking.service;

import com.banking.domain.Account;
import com.banking.domain.Transaction;
import com.banking.dto.TransactionResponse;
import com.banking.dto.TransactionFilterRequest;
import com.banking.exception.AccountNotFoundException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.opencsv.CSVWriter;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.JoinType;

import java.io.StringWriter;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public Page<TransactionResponse> getHistory(UUID accountId, TransactionFilterRequest filter, String username) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        if (!account.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Transaction> spec = buildSpecification(filter);
        
        // Filter by either fromAccount OR toAccount
        spec = spec.and((root, query, cb) -> cb.or(
                cb.equal(root.get("fromAccount").get("id"), accountId),
                cb.equal(root.get("toAccount").get("id"), accountId)
        ));

        return transactionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public Page<TransactionResponse> getAllHistory(TransactionFilterRequest filter) {
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Transaction> spec = buildSpecification(filter);
        return transactionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private Specification<Transaction> buildSpecification(TransactionFilterRequest filter) {
        return (root, query, cb) -> {
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("fromAccount", JoinType.LEFT);
                root.fetch("toAccount", JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (filter.getDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getDateFrom().atStartOfDay(ZoneOffset.UTC)));
            }
            if (filter.getDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getDateTo().atTime(LocalTime.MAX).atZone(ZoneOffset.UTC)));
            }
            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getType()));
            }
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), filter.getMaxAmount()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public TransactionResponse getById(UUID id) {
        Transaction transaction = transactionRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        return toResponse(transaction);
    }

    public String exportToCsv(UUID accountId, String username) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        if (!account.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        Specification<Transaction> spec = (root, query, cb) -> cb.or(
                cb.equal(root.get("fromAccount").get("id"), accountId),
                cb.equal(root.get("toAccount").get("id"), accountId)
        );

        Pageable pageable = PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> page = transactionRepository.findAll(spec, pageable);

        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[] { "ID", "Reference ID", "Type", "Amount", "Status", "Date", "Description" });
            for (Transaction t : page.getContent()) {
                writer.writeNext(new String[] {
                        t.getId().toString(),
                        t.getReferenceId(),
                        t.getType().name(),
                        t.getAmount().toString(),
                        t.getStatus().name(),
                        t.getCreatedAt().toString(),
                        t.getDescription()
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
        return sw.toString();
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .fromAccountId(t.getFromAccount() != null ? t.getFromAccount().getId() : null)
                .toAccountId(t.getToAccount() != null ? t.getToAccount().getId() : null)
                .fromAccountNumber(t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : null)
                .toAccountNumber(t.getToAccount() != null ? t.getToAccount().getAccountNumber() : null)
                .amount(t.getAmount())
                .type(t.getType())
                .transactionType(t.getType() != null ? t.getType().name() : null)
                .status(t.getStatus())
                .referenceId(t.getReferenceId())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .completedAt(t.getCompletedAt())
                .build();
    }
}
