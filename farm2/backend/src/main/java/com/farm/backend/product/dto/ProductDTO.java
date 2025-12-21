package com.farm.backend.product.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.farm.backend.product.entity.UnitOption;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {

    // API 통신용

    private String name; // 상품명
    private String id; // 상품ID
    private int price; // 가격
    private String unit; // 단위
    private String origin; // 원산지
    private String originDetail; // 산지 상세정보
    private String farmingType; // 재배 방식
    private String harvestDate; // 수확일
    private String expirationDate; // 유통기한
    private String description; // 제품 상세설명
    private List<String> images; // 상품 이미지 리스트
    private String mainImage; // 대표 이미지
    private List<String> tags;

    private String storageMethod; // 보관 방법
    private String shippingConditions; // 배송 조건
    private Double discountRate; // 기본 할인율
    private String discountStart; // 할인 시작일
    private String discountEnd; // 할인 종료일
    private Integer bulkMinQuantity; // 대량구매 최소 수량
    private Double bulkDiscountRate; // 대량구매 할인율
    private Integer stockWarningThreshold; // 재고 경고선
    private Integer shippingFreeThreshold; // 무료배송 기준
    private Integer additionalShippingFee; // 추가 배송비
    private List<String> certificates; // 인증서/검사서 URL

    private String category; // 과일/채소/곡물 등 카테고리
    private String categoryType; // NEW (fruit / vegetable / grain)
    private String itemType; // NEW (딸기/사과/배추/쌀)

    private int stock; // 재고 (기본 재고, 하위 호환성 유지)
    
    // 여러 단위 옵션 지원 (예: [{"unit": "1kg", "price": 10000, "stock": 50, "isDefault": true}, {"unit": "500g", "price": 5500, "stock": 30, "isDefault": false}])
    private List<UnitOption> unitOptions;

    private String sellerId; // 판매자 ID
    private String sellerName; // 판매자 이름 표시용
    private String sellerNickname; // 판매자 닉네임

    private String status; // pending(보류,대기), approved(승인), rejected(거부)

    private int salesCount; // 판매량
    private int viewCount; // 조회수

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
