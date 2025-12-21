package com.farm.backend.domain;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

//몽고디비 카트 컬렉션 매핑
@Document(collection = "cart")

@Getter
@Setter
@NoArgsConstructor //기본생성자 자동생성
@ToString //디버깅 문제점을 자세하게 보여주기 위한 어노테이션

public class Cart {

    @Id
    private String id; //몽고 고유id

    private String userId; //사용자 id
    private String productId; //상품id
    private String productName; //상품명
    private String productImage; //상품이미지 url
    private int qty; //수량
    private int price;
    private LocalDateTime createdAt; //장바구니 담은시간
    
    // 옵션 정보 (여러 단위 옵션 사용 시)
    private String selectedUnit; // 선택된 단위 (예: "1kg", "500g")
    private String selectedUnitProductName; // 선택된 옵션의 제품명

    public Cart(String userId, String productId, String productName, String productImage, int qty, int price) {
        this.userId = userId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.qty = qty;
        this.price = price;
        this.createdAt = LocalDateTime.now();
    }    
}
