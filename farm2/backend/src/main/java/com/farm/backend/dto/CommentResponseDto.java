package com.farm.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponseDto {
    private String id;
    private String postId;
    private String userId;
    private String nickname;  // 추가됨
    private String content;

    private LocalDateTime createdAt;
}
