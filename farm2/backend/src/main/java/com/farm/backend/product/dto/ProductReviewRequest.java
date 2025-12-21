package com.farm.backend.product.dto;

import java.util.List;

import lombok.Data;

@Data
public class ProductReviewRequest {
    private int rating;
    private String content;
    private List<String> pics;

    private String product;//  상품명 혜정 11/26 추가

}
