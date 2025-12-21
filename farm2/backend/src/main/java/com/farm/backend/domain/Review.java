package com.farm.backend.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "review") // MongoDB 컬렉션 이름
public class Review {

    @Id
    private String id;

    // 작성자 이름
    private String user;

    // 판매자
    private String seller;

    // 상품명
    private String product;

    // 별점 (1~5)
    private int rating;

    // 리뷰 내용
    private String content;

    // 아바타 이미지 (없는 경우 기본값 사용 가능)
    private String avatar;

    // 작성일 문자열 (예: 2025-01-18)
    private String date;

    private String reviewerId; // 리뷰 작성자 userId
    private String reviewerNick;

    private String sellerUserId; // 판매자 userId
    private String farmName; // 판매자 농장
    private String sellerName; // 판매자 이름

    private String userId;

}
