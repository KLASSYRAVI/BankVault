package com.banking.service;

import com.banking.domain.Account;
import com.banking.domain.User;
import com.banking.domain.enums.AccountType;
import com.banking.exception.AccountNotFoundException;
import com.banking.exception.BusinessRuleException;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.banking.dto.AccountLookupResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountLookupResponse lookupAccount(String accountNumber) {
        Account account = accountRepository.findByAccountNumberAndIsActiveTrue(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found or inactive"));
        return AccountLookupResponse.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .ownerUsername(account.getUser().getUsername())
                .build();
    }

    @Transactional
    public void closeAccount(UUID accountId, String username) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        if (!account.getUser().getUsername().equals(username)) {
            throw new BusinessRuleException("Unauthorized account access");
        }

        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleException("Cannot close account with remaining balance. Please transfer funds first.");
        }

        List<Account> activeAccounts = accountRepository.findByUserIdAndIsActiveTrue(account.getUser().getId());
        if (activeAccounts.size() <= 1) {
            throw new BusinessRuleException("You must keep at least one active account.");
        }

        account.setActive(false);
        accountRepository.save(account);
    }

    @Transactional
    public Account createAccount(String username, AccountType type) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessRuleException("User not found"));

        Account account = Account.builder()
                .user(user)
                .accountNumber(generateAccountNumber())
                .accountType(type)
                .balance(BigDecimal.ZERO)
                .currency("USD")
                .isActive(true)
                .build();

        return accountRepository.save(account);
    }

    public List<Account> getAccountsByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessRuleException("User not found"));

        return accountRepository.findByUserIdAndIsActiveTrue(user.getId());
    }

    @Transactional
    public void deactivateAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));
        account.setActive(false);
        accountRepository.save(account);
    }

    public BigDecimal getBalance(UUID accountId, String username) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        if (!account.getUser().getUsername().equals(username)) {
            throw new BusinessRuleException("Unauthorized");
        }

        return account.getBalance();
    }

    private String generateAccountNumber() {
        return "CHK" + (long) (Math.random() * 1000000000000L);
    }
}
