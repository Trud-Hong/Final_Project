package com.farm.backend.product.dto;

import lombok.Data;

@Data
public class ProductQnARequest {

    private String title;        // 문의 제목
    private String question;     // 문의 내용 (old)
    private String content;      // 실제 문의 내용
    private boolean privateFlag; // 비공개 여부
    private String answer;       // 판매자 답변 (답변 등록)
    private String sellerId;     // 판매자 ID
    private String userId;
}
