package com.farm.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostResponseDto {
    private String id;
    private String title;
    private String content;
    private String imageUrl;

    private int views;
    private int commentCount;
    private long likeCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 추가됨
    private String userId;
    private String nickname;
}
