package com.banking.service;

import com.banking.domain.Account;
import com.banking.domain.Transaction;
import com.banking.domain.User;
import com.banking.domain.enums.TransactionStatus;
import com.banking.domain.enums.TransactionType;
import com.banking.dto.TransactionResponse;
import com.banking.dto.TransferRequest;
import com.banking.exception.*;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FundTransferService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse transferFunds(TransferRequest req, String initiatorUsername) {
        log.info("Initiating fund transfer for request: {}", req.getIdempotencyKey());

        if (transactionRepository.existsByReferenceId(req.getIdempotencyKey())) {
            throw new DuplicateTransferException("Transfer request already processed");
        }

        User initiator = userRepository.findByUsername(initiatorUsername)
                .orElseThrow(() -> new BusinessRuleException("User not found"));

        UUID firstLockId;
        UUID secondLockId;

        if (req.getFromAccountId().compareTo(req.getToAccountId()) < 0) {
            firstLockId = req.getFromAccountId();
            secondLockId = req.getToAccountId();
        } else if (req.getFromAccountId().compareTo(req.getToAccountId()) > 0) {
            firstLockId = req.getToAccountId();
            secondLockId = req.getFromAccountId();
        } else {
            throw new BusinessRuleException("Cannot transfer to the same account");
        }

        Account firstAccount = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new AccountNotFoundException("Account " + firstLockId + " not found"));
        Account secondAccount = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new AccountNotFoundException("Account " + secondLockId + " not found"));

        Account fromAccount = req.getFromAccountId().equals(firstAccount.getId()) ? firstAccount : secondAccount;
        Account toAccount = req.getToAccountId().equals(firstAccount.getId()) ? firstAccount : secondAccount;

        if (!fromAccount.getUser().getId().equals(initiator.getId())) {
            throw new UnauthorizedAccountAccessException("Not authorized to transfer from this account");
        }

        if (!fromAccount.isActive() || !toAccount.isActive()) {
            throw new BusinessRuleException("One or both accounts are inactive");
        }

        if (!fromAccount.getCurrency().equals(toAccount.getCurrency())) {
            throw new BusinessRuleException("Currency mismatch");
        }

        if (req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Transfer amount must be positive");
        }

        if (fromAccount.getBalance().compareTo(req.getAmount()) < 0) {
            recordFailedTransaction(fromAccount, toAccount, req, "Insufficient funds");
            throw new InsufficientFundsException("Insufficient funds in source account");
        }

        BigDecimal oldFromBalance = fromAccount.getBalance();
        BigDecimal oldToBalance = toAccount.getBalance();

        fromAccount.setBalance(fromAccount.getBalance().subtract(req.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(req.getAmount()));

        Transaction transaction = Transaction.builder()
                .fromAccount(fromAccount)
                .toAccount(toAccount)
                .amount(req.getAmount())
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.COMPLETED)
                .referenceId(req.getIdempotencyKey())
                .description(req.getDescription())
                .completedAt(ZonedDateTime.now())
                .build();

        transactionRepository.save(transaction);
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        auditService.logAction(initiator.getId(), "TRANSFER_FUNDS_DEBIT", "Account", fromAccount.getId(),
                oldFromBalance, fromAccount.getBalance());
        auditService.logAction(initiator.getId(), "TRANSFER_FUNDS_CREDIT", "Account", toAccount.getId(),
                oldToBalance, toAccount.getBalance());

        log.info("Fund transfer completed successfully. Ref: {}", req.getIdempotencyKey());

        return TransactionResponse.builder()
                .id(transaction.getId())
                .fromAccountId(fromAccount.getId())
                .toAccountId(toAccount.getId())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .status(transaction.getStatus())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .completedAt(transaction.getCompletedAt())
                .build();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedTransaction(Account from, Account to, TransferRequest req, String reason) {
        Transaction transaction = Transaction.builder()
                .fromAccount(from)
                .toAccount(to)
                .amount(req.getAmount())
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.FAILED)
                .referenceId(req.getIdempotencyKey() + "_FAIL")
                .description(reason)
                .build();
        transactionRepository.save(transaction);
    }
}
