package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "mileage_transactions")
public class MileageTransaction {

    @Id
    private String id;

    private String userId; // 사용자 ID

    private String type; // CHARGE(충전), USE(사용), EARN(적립), REFUND(환불)

    private Long amount; // 거래 금액 (양수)

    private Long balanceAfter; // 거래 후 잔액

    private String description; // 거래 설명

    private String orderId; // 주문 ID (사용/적립 시)

    private LocalDateTime createdAt;

    public MileageTransaction() {
        this.createdAt = LocalDateTime.now();
    }

    public MileageTransaction(String userId, String type, Long amount, Long balanceAfter, String description) {
        this.userId = userId;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }
}

