package com.farm.backend.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "contact")
public class Contact {
    
    @Id
    private String id;  //MongoDB용 id

    private String userId;  //문의한 사용자 id
    private String adminId; //답변한 admin 계정
    private String title;   //문의 제목
    private String category;    //카테고리
    private String content; //문의 내용
    private String replyContent; //답변 내용
    private String status = "문의 완료";  //문의 상태
    private LocalDateTime createdAt;    //문의 생성 날짜
    private LocalDateTime repliedAt;    //문의 답변 날짜

}
