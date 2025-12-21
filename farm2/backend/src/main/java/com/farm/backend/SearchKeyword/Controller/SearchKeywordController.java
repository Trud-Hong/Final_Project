package com.farm.backend.SearchKeyword.Controller;

import com.farm.backend.SearchKeyword.dto.SearchKeywordDTO;
import com.farm.backend.SearchKeyword.service.SearchKeywordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 검색어 관련 API를 제공하는 컨트롤러
 */
@RestController // @Controller + @ResponseBody (REST API용)
@RequestMapping("/api/search") // 기본 경로 설정
@RequiredArgsConstructor // final 필드에 대한 생성자 자동 생성
// CORS는 WebConfig에서 글로벌 설정으로 처리
@Slf4j // 로깅
public class SearchKeywordController {
    
    private final SearchKeywordService searchKeywordService;
    
    /**
     * POST /api/search/save
     * 검색어 저장 및 카운트 증가
     * @param request 검색어 요청 본문
     * @return 저장된 검색어 정보
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveKeyword(@RequestBody Map<String, String> request) {
        try {
            // 요청에서 검색어 추출
            String keyword = request.get("keyword");
            
            log.info("검색어 저장 요청: {}", keyword);
            
            // 검색어 저장 또는 업데이트
            SearchKeywordDTO savedKeyword = searchKeywordService.saveOrUpdateKeyword(keyword);
            
            // 성공 응답 생성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "검색어가 저장되었습니다.");
            response.put("data", savedKeyword);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            // 유효성 검증 실패 (400 Bad Request)
            log.error("검색어 유효성 검증 실패: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            // 서버 오류 (500 Internal Server Error)
            log.error("검색어 저장 중 오류 발생", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "서버 오류가 발생했습니다.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * GET /api/search/popular
     * 인기검색어 조회 (상위 10개)
     * @return 인기검색어 목록
     */
    @GetMapping("/popular")
    public ResponseEntity<List<SearchKeywordDTO>> getPopularKeywords() {
        try {
            log.info("인기검색어 조회 요청");
            
            // 인기검색어 조회
            List<SearchKeywordDTO> popularKeywords = searchKeywordService.getPopularKeywords();
            
            return ResponseEntity.ok(popularKeywords);
            
        } catch (Exception e) {
            // 오류 발생 시 빈 리스트 반환
            log.error("인기검색어 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }
    
    /**
     * GET /api/search/recent
     * 최근 검색어 조회 (상위 10개)
     * @return 최근 검색어 목록
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SearchKeywordDTO>> getRecentKeywords() {
        try {
            log.info("최근 검색어 조회 요청");
            
            // 최근 검색어 조회
            List<SearchKeywordDTO> recentKeywords = searchKeywordService.getRecentKeywords();
            
            return ResponseEntity.ok(recentKeywords);
            
        } catch (Exception e) {
            // 오류 발생 시 빈 리스트 반환
            log.error("최근 검색어 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }
    
    /**
     * DELETE /api/search/reset
     * 모든 검색어 삭제 (관리자용)
     * @return 삭제 결과
     */
    @DeleteMapping("/reset")
    public ResponseEntity<?> resetKeywords() {
        try {
            log.warn("검색어 초기화 요청");
            
            // 모든 검색어 삭제
            searchKeywordService.deleteAllKeywords();
            
            // 성공 응답
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "모든 검색어가 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // 서버 오류
            log.error("검색어 삭제 중 오류 발생", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "서버 오류가 발생했습니다.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * GET /api/search/health
     * API 상태 확인용 엔드포인트
     * @return 서버 상태
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "running");
        response.put("message", "Search API가 정상 작동 중입니다.");
        
        return ResponseEntity.ok(response);
    }
}