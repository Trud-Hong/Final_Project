package com.farm.backend.dto;

import lombok.Data;

@Data
public class SellerApplyDTO {

    private String sellerName;
    private String phone;
    private String farmName;
    private String address;
    private String intro;
    private String businessNumber;
    private String bank;
    private String accountNumber;
    private String category;
    private String location;
    private String nickname;

    private byte[] image;
    private String imageName;
}
