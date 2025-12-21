package com.farm.backend.service;

import com.farm.backend.domain.Mileage;
import com.farm.backend.domain.MileageTransaction;
import com.farm.backend.domain.Member;
import com.farm.backend.domain.WithdrawRequest;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.MileageRepository;
import com.farm.backend.repository.MileageTransactionRepository;
import com.farm.backend.repository.WithdrawRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WithdrawRequestService {

    private final WithdrawRequestRepository withdrawRequestRepository;
    private final MileageRepository mileageRepository;
    private final MileageTransactionRepository transactionRepository;
    private final MemberRepository memberRepository;

    /**
     * 출금 요청 생성
     */
    @Transactional
    public WithdrawRequest createWithdrawRequest(String userId, Long amount, String bankName, String accountNumber) {
        // 사용자 정보 조회
        Optional<Member> memberOpt = memberRepository.findByUserId(userId);
        if (!memberOpt.isPresent()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        Member member = memberOpt.get();

        // 마일리지 잔액 확인
        Mileage mileage = mileageRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("마일리지 정보를 찾을 수 없습니다."));

        if (mileage.getBalance() < amount) {
            throw new IllegalArgumentException("마일리지 잔액이 부족합니다.");
        }

        if (amount < 1000) {
            throw new IllegalArgumentException("최소 출금 금액은 1,000원입니다.");
        }

        // 출금 요청 생성
        WithdrawRequest request = new WithdrawRequest();
        request.setUserId(userId);
        request.setUserName(member.getName() != null ? member.getName() : member.getNickname());
        request.setAmount(amount);
        request.setBankName(bankName);
        request.setAccountNumber(accountNumber);
        request.setStatus("PENDING");

        return withdrawRequestRepository.save(request);
    }

    /**
     * 사용자의 출금 요청 목록 조회
     */
    public List<WithdrawRequest> getUserWithdrawRequests(String userId) {
        return withdrawRequestRepository.findByUserIdOrderByRequestedAtDesc(userId);
    }

    /**
     * 모든 출금 요청 목록 조회 (관리자용)
     */
    public List<WithdrawRequest> getAllWithdrawRequests() {
        return withdrawRequestRepository.findAllByOrderByRequestedAtDesc();
    }

    /**
     * 상태별 출금 요청 목록 조회 (관리자용)
     */
    public List<WithdrawRequest> getWithdrawRequestsByStatus(String status) {
        return withdrawRequestRepository.findByStatusOrderByRequestedAtDesc(status);
    }

    /**
     * 출금 요청 승인
     */
    @Transactional
    public WithdrawRequest approveWithdrawRequest(String requestId, String adminUserId) {
        WithdrawRequest request = withdrawRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("출금 요청을 찾을 수 없습니다."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("이미 처리된 요청입니다.");
        }

        // 마일리지 차감
        Mileage mileage = mileageRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("마일리지 정보를 찾을 수 없습니다."));

        if (mileage.getBalance() < request.getAmount()) {
            throw new IllegalArgumentException("마일리지 잔액이 부족합니다.");
        }

        Long newBalance = mileage.getBalance() - request.getAmount();
        mileage.setBalance(newBalance);
        mileage.setUpdatedAt(LocalDateTime.now());
        mileageRepository.save(mileage);

        // 거래 내역 기록
        MileageTransaction transaction = new MileageTransaction(
                request.getUserId(),
                "WITHDRAW",
                request.getAmount(),
                newBalance,
                "마일리지 출금 - " + request.getBankName() + " " + request.getAccountNumber()
        );
        transactionRepository.save(transaction);

        // 요청 상태 업데이트
        request.setStatus("APPROVED");
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUserId);

        return withdrawRequestRepository.save(request);
    }

    /**
     * 출금 요청 거절
     */
    @Transactional
    public WithdrawRequest rejectWithdrawRequest(String requestId, String adminUserId, String rejectReason) {
        WithdrawRequest request = withdrawRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("출금 요청을 찾을 수 없습니다."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("이미 처리된 요청입니다.");
        }

        request.setStatus("REJECTED");
        request.setRejectReason(rejectReason);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUserId);

        return withdrawRequestRepository.save(request);
    }

    /**
     * 출금 요청 상세 조회
     */
    public WithdrawRequest getWithdrawRequest(String requestId) {
        return withdrawRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("출금 요청을 찾을 수 없습니다."));
    }
}

