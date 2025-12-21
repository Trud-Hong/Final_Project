package com.farm.backend.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 카카오페이 결제 준비 요청용 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDto {
    private String orderId;
    private String productId; // 상품 ID
    private String productName; // 상품명
    private int quantity; // 수량
    private int totalAmount; // 결제 금액
    private Long mileageUsed = 0L; // 사용한 마일리지 금액
}
