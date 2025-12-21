package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "post")
public class Post {

    @Id
    private String id;

    private String title;
    private String content;
   
    private String imageUrl;

    private int views;
    private int commentCount;

    private int likeCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String category;
    private String userId;

    private String nickname;
}
