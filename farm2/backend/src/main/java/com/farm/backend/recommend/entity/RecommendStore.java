package com.farm.backend.recommend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "recommend_store")
public class RecommendStore {

    @Id
    private String id;

    // 판매자 기본 정보
    private String sellerId;
    private String phone;
    private String sellerName;

    // 농장 정보
    private String farmName;
    private String category;
    private String location;
    private String address;
    private String intro;

    // 이미지 및 설명
    private String imageUrl;

    // 추천 시작일
    private String startDate;

    private int sortOrder;
}
