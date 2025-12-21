package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "withdraw_requests")
public class WithdrawRequest {

    @Id
    private String id;

    private String userId; // 사용자 ID
    private String userName; // 사용자 이름
    private Long amount; // 출금 금액
    private String bankName; // 은행명
    private String accountNumber; // 계좌번호
    private String status; // PENDING(대기), APPROVED(승인), REJECTED(거절)
    private String rejectReason; // 거절 사유
    private LocalDateTime requestedAt; // 요청 일시
    private LocalDateTime processedAt; // 처리 일시
    private String processedBy; // 처리한 관리자 ID

    public WithdrawRequest() {
        this.status = "PENDING";
        this.requestedAt = LocalDateTime.now();
    }
}

