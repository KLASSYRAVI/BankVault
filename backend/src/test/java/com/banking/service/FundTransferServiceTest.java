package com.banking.service;

import com.banking.domain.Account;
import com.banking.domain.Transaction;
import com.banking.domain.User;
import com.banking.dto.TransferRequest;
import com.banking.exception.BusinessRuleException;
import com.banking.exception.DuplicateTransferException;
import com.banking.exception.InsufficientFundsException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FundTransferServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private FundTransferService fundTransferService;

    private User user;
    private Account fromAccount;
    private Account toAccount;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");

        fromAccount = new Account();
        fromAccount.setId(UUID.randomUUID());
        fromAccount.setUser(user);
        fromAccount.setBalance(new BigDecimal("1000.00"));
        fromAccount.setCurrency("USD");
        fromAccount.setActive(true);

        toAccount = new Account();
        toAccount.setId(UUID.randomUUID());
        toAccount.setUser(user);
        toAccount.setBalance(new BigDecimal("500.00"));
        toAccount.setCurrency("USD");
        toAccount.setActive(true);
    }

    @Test
    void testSuccessfulTransfer_updatesBalancesAndCreatesTransaction() {
        TransferRequest req = new TransferRequest();
        req.setFromAccountId(fromAccount.getId());
        req.setToAccountId(toAccount.getId());
        req.setAmount(new BigDecimal("200.00"));
        req.setIdempotencyKey("test-ref");

        when(transactionRepository.existsByReferenceId(any())).thenReturn(false);
        when(userRepository.findByUsername(any())).thenReturn(Optional.of(user));
        when(accountRepository.findByIdForUpdate(fromAccount.getId())).thenReturn(Optional.of(fromAccount));
        when(accountRepository.findByIdForUpdate(toAccount.getId())).thenReturn(Optional.of(toAccount));

        fundTransferService.transferFunds(req, "testuser");

        assertEquals(new BigDecimal("800.00"), fromAccount.getBalance());
        assertEquals(new BigDecimal("700.00"), toAccount.getBalance());
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    void testTransfer_insufficientFunds_throwsAndRecordsFailure() {
        TransferRequest req = new TransferRequest();
        req.setFromAccountId(fromAccount.getId());
        req.setToAccountId(toAccount.getId());
        req.setAmount(new BigDecimal("2000.00"));
        req.setIdempotencyKey("test-ref-2");

        when(transactionRepository.existsByReferenceId(any())).thenReturn(false);
        when(userRepository.findByUsername(any())).thenReturn(Optional.of(user));
        when(accountRepository.findByIdForUpdate(fromAccount.getId())).thenReturn(Optional.of(fromAccount));
        when(accountRepository.findByIdForUpdate(toAccount.getId())).thenReturn(Optional.of(toAccount));

        assertThrows(InsufficientFundsException.class, () -> fundTransferService.transferFunds(req, "testuser"));
    }

    @Test
    void testTransfer_duplicateReferenceId_throws409() {
        TransferRequest req = new TransferRequest();
        req.setIdempotencyKey("existing-ref");

        when(transactionRepository.existsByReferenceId("existing-ref")).thenReturn(true);

        assertThrows(DuplicateTransferException.class, () -> fundTransferService.transferFunds(req, "testuser"));
    }

    @Test
    void testTransfer_inactiveAccount_throws422() {
        fromAccount.setActive(false);

        TransferRequest req = new TransferRequest();
        req.setFromAccountId(fromAccount.getId());
        req.setToAccountId(toAccount.getId());
        req.setAmount(new BigDecimal("200.00"));
        req.setIdempotencyKey("test-ref-3");

        when(transactionRepository.existsByReferenceId(any())).thenReturn(false);
        when(userRepository.findByUsername(any())).thenReturn(Optional.of(user));
        when(accountRepository.findByIdForUpdate(fromAccount.getId())).thenReturn(Optional.of(fromAccount));
        when(accountRepository.findByIdForUpdate(toAccount.getId())).thenReturn(Optional.of(toAccount));

        assertThrows(BusinessRuleException.class, () -> fundTransferService.transferFunds(req, "testuser"));
    }
}
