package com.farm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NoticeListDto {
    private String id;
    private String title;
    private String writerNickname;
    private LocalDateTime createdAt;
    private int views;
    private boolean pinned;
}
