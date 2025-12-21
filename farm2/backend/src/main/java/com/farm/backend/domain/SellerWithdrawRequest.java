package com.farm.backend.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "seller_withdraw_requests")
public class SellerWithdrawRequest {

    @Id
    private String id;

    private String sellerId; // 판매자 ID
    private long amount; // 출금 금액
    private String bankName; // 등록된 계좌
    private String accountNumber;

    private String status; // REQUESTED, APPROVED, REJECTED
    private String rejectReason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private String processedBy; // 관리자 ID

    public SellerWithdrawRequest() {
        this.status = "REQUESTED";
        this.requestedAt = LocalDateTime.now();
    }
}
