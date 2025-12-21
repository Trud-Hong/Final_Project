package com.farm.backend.product.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * 상품 단위 옵션 (예: 1kg, 500g, 100g 등)
 * MongoDB 중첩 문서로 저장됨
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitOption {
    private String productName; // 옵션별 제품명 (예: "신선한 사과 1kg", "신선한 사과 500g")
    private String unit; // 단위 (예: "1kg", "500g", "100g")
    private int price; // 해당 단위의 가격
    private int stock; // 해당 단위의 재고
    
    // 기본 단위 여부 (기본으로 선택될 단위)
    @Field("isDefault")
    private Boolean isDefault;
}

