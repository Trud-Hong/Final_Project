package com.farm.backend.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class SellerApplyInfo {

    private boolean applied;
    private String status; // PENDING / APPROVED / REJECTED
    private LocalDateTime createdAt;

    private String phone;
    private String farmName;
    private String intro;
    private String businessNumber;

    private String sellerName;
    private String nickname;

    private String category;
    private String location;
    private String address;

    private String bank;
    private String accountNumber;

    private byte[] image;
    private String imageName;
}
