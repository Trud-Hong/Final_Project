package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "emailverify")
public class EmailVerify {

    @Id
    private String id;

    private String phone; 
    private String email;
    private String code;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}
