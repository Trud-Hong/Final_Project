package com.farm.backend.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "seller")
public class Seller {

    @Id
    private String id;
    private String sellerName; // 판매자 이름
    private String phone; // 연락처
    private String farmName; // 농장이름
    private String address; // 농장 주소
    private String intro; // 소개
    private String businessNumber; // 사업자 등록번호

    private String category; // 품목 (채소/과일/곡물)
    private String location; // 지역 (서울가락 등)
    private String userId; // 사용자 ID
    private String nickname;

    private byte[] image; // 이미지 파일
    private String imageName; // 원본 파일명

    private long balance; // 출금 가능한 정산잔액
    private long totalSales; // 누적 매출 (선택)
    private long totalWithdrawn; // 누적 출금액 (선택)
    private String bank; // 은행명
    private String accountNumber; // 계좌번호
    private String accountHolder; // 예금주명

}
