package com.farm.backend.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
//몽고DB연결
@Document(collection = "addrList")
public class AddrList {

    @Id
    private String id;

    private String userId;
    private String title;
    private String addr1;
    private String addr2;
    private String post;
    private String phone;
    private boolean isDefault = false; // 기본 배송지 여부

    public AddrList() {}

    public AddrList(String userId, String title, String addr1, String addr2, String post, String phone) {
        this.userId = userId;
        this.title = title;
        this.addr1 = addr1;
        this.addr2 = addr2;
        this.post = post;
        this.phone = phone;
    }



}
