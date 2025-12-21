package com.farm.backend.service;

import com.farm.backend.domain.Mileage;
import com.farm.backend.domain.MileageTransaction;
import com.farm.backend.repository.MileageRepository;
import com.farm.backend.repository.MileageTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MileageService {

    private final MileageRepository mileageRepository;
    private final MileageTransactionRepository transactionRepository;

    /**
     * 사용자의 마일리지 잔액 조회 (없으면 생성)
     */
    public Mileage getOrCreateMileage(String userId) {
        return mileageRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Mileage mileage = new Mileage();
                    mileage.setUserId(userId);
                    mileage.setBalance(0L);
                    mileage.setCreatedAt(LocalDateTime.now());
                    mileage.setUpdatedAt(LocalDateTime.now());
                    return mileageRepository.save(mileage);
                });
    }

    /**
     * 마일리지 충전
     */
    @Transactional
    public MileageTransaction chargeMileage(String userId, Long amount, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("충전 금액은 0보다 커야 합니다.");
        }

        Mileage mileage = getOrCreateMileage(userId);
        Long newBalance = mileage.getBalance() + amount;
        mileage.setBalance(newBalance);
        mileage.setUpdatedAt(LocalDateTime.now());
        mileageRepository.save(mileage);

        MileageTransaction transaction = new MileageTransaction(
                userId, "CHARGE", amount, newBalance, description
        );
        return transactionRepository.save(transaction);
    }

    /**
     * 마일리지 사용 (결제 시)
     */
    @Transactional
    public MileageTransaction useMileage(String userId, Long amount, String orderId, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("사용 금액은 0보다 커야 합니다.");
        }

        Mileage mileage = getOrCreateMileage(userId);
        if (mileage.getBalance() < amount) {
            throw new IllegalArgumentException("마일리지 잔액이 부족합니다.");
        }

        Long newBalance = mileage.getBalance() - amount;
        mileage.setBalance(newBalance);
        mileage.setUpdatedAt(LocalDateTime.now());
        mileageRepository.save(mileage);

        MileageTransaction transaction = new MileageTransaction(
                userId, "USE", amount, newBalance, description
        );
        transaction.setOrderId(orderId);
        return transactionRepository.save(transaction);
    }

    /**
     * 마일리지 적립 (판매자에게 지급)
     */
    @Transactional
    public MileageTransaction earnMileage(String userId, Long amount, String orderId, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("적립 금액은 0보다 커야 합니다.");
        }

        Mileage mileage = getOrCreateMileage(userId);
        Long newBalance = mileage.getBalance() + amount;
        mileage.setBalance(newBalance);
        mileage.setUpdatedAt(LocalDateTime.now());
        mileageRepository.save(mileage);

        MileageTransaction transaction = new MileageTransaction(
                userId, "EARN", amount, newBalance, description
        );
        transaction.setOrderId(orderId);
        return transactionRepository.save(transaction);
    }

    /**
     * 마일리지 환불
     */
    @Transactional
    public MileageTransaction refundMileage(String userId, Long amount, String orderId, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("환불 금액은 0보다 커야 합니다.");
        }

        Mileage mileage = getOrCreateMileage(userId);
        Long newBalance = mileage.getBalance() + amount;
        mileage.setBalance(newBalance);
        mileage.setUpdatedAt(LocalDateTime.now());
        mileageRepository.save(mileage);

        MileageTransaction transaction = new MileageTransaction(
                userId, "REFUND", amount, newBalance, description
        );
        transaction.setOrderId(orderId);
        return transactionRepository.save(transaction);
    }

    /**
     * 사용자의 마일리지 거래 내역 조회
     */
    public List<MileageTransaction> getTransactionHistory(String userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 주문별 마일리지 거래 내역 조회
     */
    public List<MileageTransaction> getTransactionsByOrderId(String orderId) {
        return transactionRepository.findByOrderId(orderId);
    }
}

