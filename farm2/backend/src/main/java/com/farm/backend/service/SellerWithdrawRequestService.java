package com.farm.backend.service;

import com.farm.backend.domain.Mileage;
import com.farm.backend.domain.MileageTransaction;
import com.farm.backend.domain.Seller;
import com.farm.backend.domain.SellerWithdrawRequest;
import com.farm.backend.repository.MileageRepository;
import com.farm.backend.repository.MileageTransactionRepository;
import com.farm.backend.repository.SellerRepository;
import com.farm.backend.repository.SellerWithdrawRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerWithdrawRequestService {

    private final SellerRepository sellerRepository;
    private final SellerWithdrawRequestRepository withdrawRepo;
    private final MileageRepository mileageRepository;
    private final MileageTransactionRepository transactionRepository;

    /** 1) 판매자 출금 요청 생성 */
    public SellerWithdrawRequest createRequest(String sellerId, long amount) {
        Seller seller = sellerRepository.findById(sellerId).orElseThrow(
                () -> new IllegalArgumentException("판매자를 찾을 수 없습니다."));
        return createRequest(sellerId, amount, seller.getBank(), seller.getAccountNumber());
    }

    /** 1) 판매자 출금 요청 생성 (은행명, 계좌번호 지정) */
    public SellerWithdrawRequest createRequest(String sellerId, long amount, String bankName, String accountNumber) {

        Seller seller = sellerRepository.findById(sellerId).orElseThrow(
                () -> new IllegalArgumentException("판매자를 찾을 수 없습니다."));

        // 잔액 확인만 (차감하지 않음 - 관리자 승인 후 차감)
        if (seller.getBalance() < amount) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        // 대기중인 정산 요청 금액 합계 계산
        List<SellerWithdrawRequest> pendingRequests = withdrawRepo.findBySellerId(sellerId)
                .stream()
                .filter(req -> "REQUESTED".equals(req.getStatus()))
                .collect(Collectors.toList());
        
        long pendingAmount = pendingRequests.stream()
                .mapToLong(SellerWithdrawRequest::getAmount)
                .sum();

        // totalSales를 넘을 수 없음 (대기중인 금액 포함)
        if (seller.getTotalSales() > 0 && (pendingAmount + amount) > seller.getTotalSales()) {
            long availableAmount = seller.getTotalSales() - pendingAmount;
            throw new IllegalArgumentException(
                String.format("정산 가능 금액이 부족합니다. (대기중인 정산: %d원, 총 매출: %d원, 가능 금액: %d원)", 
                    pendingAmount, seller.getTotalSales(), availableAmount > 0 ? availableAmount : 0));
        }

        if (amount < 1000) {
            throw new IllegalArgumentException("최소 출금 금액은 1,000원입니다.");
        }

        // 출금 요청 저장 (관리자 승인 대기)
        SellerWithdrawRequest request = new SellerWithdrawRequest();
        request.setSellerId(sellerId);
        request.setAmount(amount);
        request.setBankName(bankName != null ? bankName : seller.getBank());
        request.setAccountNumber(accountNumber != null ? accountNumber : seller.getAccountNumber());
        request.setRequestedAt(LocalDateTime.now());
        request.setStatus("REQUESTED");

        return withdrawRepo.save(request);
    }

    /** 2) 판매자 출금 요청 리스트 */
    public List<SellerWithdrawRequest> getRequestsBySeller(String sellerId) {
        return withdrawRepo.findBySellerId(sellerId);
    }

    /** 3) 전체 요청 (관리자 전용) */
    public List<SellerWithdrawRequest> getAllRequests() {
        return withdrawRepo.findAll();
    }

    /** 4) 상태별 요청 (관리자 전용) */
    public List<SellerWithdrawRequest> getRequestsByStatus(String status) {
        return withdrawRepo.findByStatus(status);
    }

    /** 5) 관리자 승인 */
    @Transactional
    public SellerWithdrawRequest approve(String requestId, String adminId) {

        SellerWithdrawRequest req = withdrawRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("출금 요청을 찾을 수 없습니다."));

        if (!req.getStatus().equals("REQUESTED")) {
            throw new IllegalArgumentException("이미 처리된 요청입니다.");
        }

        // 판매자 정보 조회
        Seller seller = sellerRepository.findById(req.getSellerId())
                .orElseThrow(() -> new IllegalArgumentException("판매자를 찾을 수 없습니다."));

        // 잔액 재확인 (승인 시점에 다시 확인)
        if (seller.getBalance() < req.getAmount()) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        // 관리자 승인 시 Seller balance 차감
        seller.setBalance(seller.getBalance() - req.getAmount());
        seller.setTotalWithdrawn(seller.getTotalWithdrawn() + req.getAmount());
        sellerRepository.save(seller);

        // 판매자의 Mileage도 차감
        Optional<Mileage> mileageOpt = mileageRepository.findByUserId(seller.getUserId());
        
        if (mileageOpt.isPresent()) {
            Mileage mileage = mileageOpt.get();
            
            if (mileage.getBalance() < req.getAmount()) {
                throw new IllegalArgumentException("마일리지 잔액이 부족합니다.");
            }
            
            Long newBalance = mileage.getBalance() - req.getAmount();
            mileage.setBalance(newBalance);
            mileage.setUpdatedAt(LocalDateTime.now());
            mileageRepository.save(mileage);

            // 거래 내역 기록
            MileageTransaction transaction = new MileageTransaction(
                    seller.getUserId(),
                    "WITHDRAW",
                    req.getAmount(),
                    newBalance,
                    "판매자 출금 - " + req.getBankName() + " " + req.getAccountNumber()
            );
            transactionRepository.save(transaction);
        }

        // 요청 상태 업데이트
        req.setStatus("APPROVED");
        req.setProcessedBy(adminId);
        req.setProcessedAt(LocalDateTime.now());

        return withdrawRepo.save(req);
    }

    /** 6) 관리자 거절 */
    public SellerWithdrawRequest reject(String requestId, String adminId, String reason) {

        SellerWithdrawRequest req = withdrawRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("출금 요청을 찾을 수 없습니다."));

        if (!req.getStatus().equals("REQUESTED")) {
            throw new IllegalArgumentException("이미 처리된 요청입니다.");
        }

        // 거절 시 balance 차감하지 않았으므로 복구할 필요 없음
        req.setStatus("REJECTED");
        req.setRejectReason(reason);
        req.setProcessedBy(adminId);
        req.setProcessedAt(LocalDateTime.now());

        return withdrawRepo.save(req);

    }
}
