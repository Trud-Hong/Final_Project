package com.farm.backend.SearchKeyword.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 검색어 요청/응답을 위한 DTO 클래스
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchKeywordDTO {
    
    /**
     * MongoDB Document ID
     */
    private String id;
    
    /**
     * 검색어
     */
    private String keyword;
    
    /**
     * 검색 횟수
     */
    private Integer count;
    
    /**
     * 마지막 검색 시간
     */
    private LocalDateTime lastSearchedAt;
    
    /**
     * 인기검색어 응답용 간단한 생성자
     */
    public SearchKeywordDTO(String id, String keyword, Integer count) {
        this.id = id;
        this.keyword = keyword;
        this.count = count;
    }
}

/**
 * 검색어 저장 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class SearchKeywordRequest {
    
    /**
     * 저장할 검색어
     */
    private String keyword;
}

/**
 * API 응답 래퍼 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class ApiResponse<T> {
    
    /**
     * 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * 응답 데이터
     */
    private T data;
    
    /**
     * 성공 응답 생성
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }
    
    /**
     * 실패 응답 생성
     */
    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, message, null);
    }
}