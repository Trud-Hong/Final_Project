package com.farm.backend.controller;

import com.farm.backend.service.MarketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "http://localhost:3000")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/list")
    public ResponseEntity<?> getMarketList() {
        try {
            List<Map<String, String>> marketList = marketService.readMarketData();
            return ResponseEntity.ok(marketList);
        } catch (Exception e) {
            // 에러 로깅
            System.err.println("시장 정보 조회 오류: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "시장 정보를 불러오는 중 오류가 발생했습니다.");
            if (e.getCause() != null) {
                errorResponse.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse);
        }
    }

    /**
     * 시장명으로 특정 시장의 상세 정보를 조회합니다.
     * URL 인코딩된 시장명을 받아서 디코딩합니다.
     */
    @GetMapping("/detail/{code}")
    public ResponseEntity<?> getMarketDetail(@PathVariable String code) {
        try {

            Map<String, String> market = marketService.getMarketByCode(code);
            return ResponseEntity.ok(market);
        } catch (Exception e) {
            // 에러 로깅
            System.err.println("시장 상세 정보 조회 오류: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "시장 상세 정보를 불러오는 중 오류가 발생했습니다.");
            if (e.getCause() != null) {
                errorResponse.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorResponse);
        }
    }
}
