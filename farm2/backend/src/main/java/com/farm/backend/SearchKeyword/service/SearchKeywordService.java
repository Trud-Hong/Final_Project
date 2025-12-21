package com.farm.backend.SearchKeyword.service;

import com.farm.backend.SearchKeyword.dto.SearchKeywordDTO;
import com.farm.backend.SearchKeyword.entity.SearchKeyword;
import com.farm.backend.SearchKeyword.repository.SearchKeywordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 검색어 비즈니스 로직을 처리하는 서비스
 */
@Service
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 생성 (의존성 주입)
@Slf4j // 로깅을 위한 Logger 자동 생성
public class SearchKeywordService {
    
    private final SearchKeywordRepository searchKeywordRepository;
    
    /**
     * 검색어 저장 및 카운트 증가
     * @param keyword 검색어
     * @return 저장된 검색어 DTO
     */
    @Transactional
    public SearchKeywordDTO saveOrUpdateKeyword(String keyword) {
        // 입력값 검증 및 정제
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 비어있을 수 없습니다.");
        }
        
        String trimmedKeyword = keyword.trim();
        log.info("검색어 저장 시도: {}", trimmedKeyword);
        
        // 기존 검색어가 있는지 조회
        Optional<SearchKeyword> existingKeyword = searchKeywordRepository.findByKeyword(trimmedKeyword);
        
        SearchKeyword searchKeyword;
        
        if (existingKeyword.isPresent()) {
            // 기존 검색어가 있으면 카운트 증가
            searchKeyword = existingKeyword.get();
            searchKeyword.incrementCount();
            log.info("검색어 카운트 증가: {} ({}회)", trimmedKeyword, searchKeyword.getCount());
        } else {
            // 새로운 검색어 생성
            searchKeyword = new SearchKeyword(trimmedKeyword);
            log.info("새 검색어 생성: {}", trimmedKeyword);
        }
        
        // MongoDB에 저장
        searchKeyword = searchKeywordRepository.save(searchKeyword);
        
        // Entity를 DTO로 변환하여 반환
        return convertToDTO(searchKeyword);
    }
    
    /**
     * 인기검색어 조회 (검색 횟수 기준 상위 10개)
     * @return 인기검색어 목록
     */
    @Transactional(readOnly = true)
    public List<SearchKeywordDTO> getPopularKeywords() {
        log.info("인기검색어 조회");
        
        // 검색 횟수 기준 내림차순으로 상위 10개 조회
        List<SearchKeyword> keywords = searchKeywordRepository.findTop10ByOrderByCountDesc();
        
        // Entity 리스트를 DTO 리스트로 변환
        return keywords.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 최근 검색어 조회 (마지막 검색 시간 기준 상위 10개)
     * @return 최근 검색어 목록
     */
    @Transactional(readOnly = true)
    public List<SearchKeywordDTO> getRecentKeywords() {
        log.info("최근 검색어 조회");
        
        // 마지막 검색 시간 기준 내림차순으로 상위 10개 조회
        List<SearchKeyword> keywords = searchKeywordRepository.findTop10ByOrderByLastSearchedAtDesc();
        
        // Entity 리스트를 DTO 리스트로 변환
        return keywords.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 모든 검색어 삭제 (관리자용)
     */
    @Transactional
    public void deleteAllKeywords() {
        log.warn("모든 검색어 삭제 실행");
        searchKeywordRepository.deleteAll();
    }
    
    /**
     * Entity를 DTO로 변환하는 헬퍼 메서드
     * @param entity SearchKeyword Entity
     * @return SearchKeywordDTO
     */
    private SearchKeywordDTO convertToDTO(SearchKeyword entity) {
        return new SearchKeywordDTO(
            entity.getId(),
            entity.getKeyword(),
            entity.getCount(),
            entity.getLastSearchedAt()
        );
    }
}