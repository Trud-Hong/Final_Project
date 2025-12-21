//혜정 11/17 주문내역리스트(모델부분)
package com.farm.backend.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Document(collection = "orderList") // 몽고DB orders 컬렉션과 연결.(주문내역DB)

// 게터세터 롬북 어노테이션
@Getter
@Setter
@ToString // 디버깅 문제점을 자세하게 보여주기 위한 어노테이션

public class Order {

    @Id
    private String id; // 몽고디비 id(자동생성)

    private String userId; //구매자 id(차후 로그인 변수와 맞춰야함)


    @JsonProperty("pname")
    private String pName; //상품명
    //변수는 두단어를 붙이는게 가장 베스트 pName 이런식으로 하면 게터세터 어노테이션을 쓸때 대소문자 인식이 컴 멋대로 되어서 정확한 정보를 불러올수가 없음. 그래서 이런경우에는 강제적으로 pName 변수를 쓰도록 제이슨프로퍼티 사용.
    
    
    private String productId; //상품 ID
    private String productImage; //상품 이미지 URL
    private int price; //단가
    private int qty; //구매수량
    private int totalPrice; //총결제금액
    private LocalDateTime orderDate; //구매날짜
    private String status; //결제상태 추가 11/25 혜정

    private String cancelReason; // 구매자 주문취소 사유
    private String cancelPreviousStatus; // 취소요청 전 상태
    private boolean cancelRejected; // 취소거절 여부
    private String cancelRejectReason; // 판매자 거절 사유

    private String refundReason; // 환불 요청 사유
    private String refundPreviousStatus;
    private String refundRejectReason; // 판매자가 입력한 환불 거절 사유
    private boolean refundRejected; // 환불 거절 여부

    // 마일리지 시스템 관련 필드
    private String sellerId; // 판매자 ID
    // deliveryStatus 제거 - status로 통일 (status: 결제완료, 배송준비중, 배송중, 배송완료, 환불완료 등)
    private String receiveStatus = "미인수"; // 인수상태: 미인수, 인수완료
    private Long mileageUsed = 0L; // 사용한 마일리지 금액
    
    // 여러 주문을 그룹화하는 필드 (같은 장바구니 구매를 묶음)
    private String orderGroupId; // 주문 그룹 ID (같은 구매 세션의 주문들을 묶음)
    
    // 배송지 정보
    private String deliveryTitle; // 배송지 별칭 (예: 집, 회사)
    private String deliveryPost; // 우편번호
    private String deliveryAddr1; // 기본 주소
    private String deliveryAddr2; // 상세 주소
    private String deliveryPhone; // 연락처
    
    // 단위 옵션 정보 (여러 단위 옵션 사용 시)
    private String selectedUnit; // 선택된 단위 (예: "1kg", "500g")
    private String selectedUnitProductName; // 선택된 옵션의 제품명

    public Order() {
        this.status = "결제완료"; // 기본값 설정 (결제완료 후 배송준비중 상태)
    }

    public Order(String userId, String pName, int price, int qty, int totalPrice, LocalDateTime orderDate) {
        this.userId = userId;
        this.pName = pName;
        this.price = price;
        this.qty = qty;
        this.totalPrice = totalPrice;
        this.orderDate = orderDate;
        this.status = "결제완료"; // 기본값 설정 (결제완료 후 배송준비중 상태)
    }

    public Order(String userId, String pName, String productId, String productImage, int price, int qty, int totalPrice,
            LocalDateTime orderDate) {
        this.userId = userId;
        this.pName = pName;
        this.productId = productId;
        this.productImage = productImage;
        this.price = price;
        this.qty = qty;
        this.totalPrice = totalPrice;
        this.orderDate = orderDate;
        this.status = "결제완료"; // 기본값 설정 (결제완료 후 배송준비중 상태)
    }

    public Order(String userId, String pName, String productId, String productImage, int price, int qty, int totalPrice,
            LocalDateTime orderDate, String status) {
        this.userId = userId;
        this.pName = pName;
        this.productId = productId;
        this.productImage = productImage;
        this.price = price;
        this.qty = qty;
        this.totalPrice = totalPrice;
        this.orderDate = orderDate;
        this.status = status;
    }

}
