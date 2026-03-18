package com.banking.repository;

import com.banking.domain.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    boolean existsByReferenceId(String referenceId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.createdAt >= :start AND t.status = 'COMPLETED'")
    BigDecimal sumVolumeSince(@Param("start") ZonedDateTime start);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'FAILED' AND t.createdAt >= :start")
    long countFailedTransactionsSince(@Param("start") ZonedDateTime start);
}
