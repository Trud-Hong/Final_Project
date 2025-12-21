package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Document(collection = "member")
public class Member {

    @Id
    private String id; // MongoDB ObjectId

    @Indexed(unique = true)
    private String userId;

    private String password;

    private String name;
    private String nickname;
    private String phone;
    private SellerApplyInfo sellerApply; // 판매자 신청 정보

    @Indexed(unique = true)
    private String email;

    private String provider = "normal";
    private boolean isDeleted = false;

    private String verifyCode;

    private String role = "ROLE_USER";

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime updatedAt;

    private Boolean isActive = true;

    // 토스페이먼츠 customerKey (UUID)
    private String customerKey;

    // customerKey 자동 생성
    public String getCustomerKey() {
        if (customerKey == null || customerKey.isEmpty()) {
            customerKey = UUID.randomUUID().toString().replace("-", "");
        }
        return customerKey;
    }
}
