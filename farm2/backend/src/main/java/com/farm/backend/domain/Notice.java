package com.farm.backend.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notice")
public class Notice {

    @Id
    private String id;

    private String title;
    private String content;

    private int views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 글쓴이 로그인 아이디
    private String userId;

    @Builder.Default
    private boolean pinned = false;

    public void setCreateDateNow() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void setUpdateDateNow() {
        this.updatedAt = LocalDateTime.now();
    }
}
