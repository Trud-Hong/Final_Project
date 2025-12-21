package com.farm.backend.product.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "productQnA")
public class ProductQnA {

    @Id
    private String id;

    private String productId;

    private String userId;    // 작성자 userId (권한 체크용)
    private String author;    // 작성자 닉네임 (표시용)

    private String title;     // 문의 제목
    private String question;  // 문의 내용(옛 필드)
    private String content;   // 실제로 화면에 보여줄 내용
    private String answer;    // 판매자 답변

    private String sellerId;  // ★ 이 문의가 걸려있는 상품의 판매자 userId

    private boolean privateFlag; // 비공개 여부

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime answeredAt;

    private String productName;   // 상품명 추가

}


/*
 * 1) 문의 작성
 * 
 * POST /products/{productId}/qna
 * 
 * 2) 특정 상품 문의 목록 조회
 * 
 * GET /products/{productId}/qna
 * 
 * 3) 판매자 답변 작성
 * 
 * POST /products/{productId}/qna/{qnaId}/answer
 * 
 * 4) 문의 수정 (사용자 본인)
 * 
 * PUT /products/{productId}/qna/{qnaId}
 * 
 * 5) 문의 삭제 (사용자 본인)
 * 
 * DELETE /products/{productId}/qna/{qnaId}
 * 
 * 
 * 
 * 
 */