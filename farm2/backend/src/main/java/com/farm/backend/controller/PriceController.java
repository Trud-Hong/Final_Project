package com.farm.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/price")
@CrossOrigin(origins = "http://localhost:3000")
public class PriceController {

    private final RestTemplate restTemplate;
    private static final String MARKET_LIST_URL = "http://211.237.50.150:7080/openapi/ea0273ae5fe4ac47dcf337041bb7eb869549f2409cb60964ce1cf6d9d093ff86/json/Grid_20240625000000000661_1/1/33";
    private static final String PRICE_DATA_URL = "http://211.237.50.150:7080/openapi/ea0273ae5fe4ac47dcf337041bb7eb869549f2409cb60964ce1cf6d9d093ff86/json/Grid_20240625000000000654_1/1/1000";

    // 새로운 API //&p_regday=2025-10-01
    private static final String PRICE_DATA_URL2_BASE = "https://www.kamis.or.kr/service/price/xml.do?action=dailyPriceByCategoryList&p_product_cls_code=02&p_convert_kg_yn=N&p_item_category_code=200&p_cert_key=d8ebcad4-baab-446b-91b7-00cc9bcac3af&p_cert_id=6914&p_returntype=json";

    public PriceController() {
        this.restTemplate = new RestTemplate();
    }

    // 전국 시장 목록 조회 (원본 JSON 그대로 반환)
    @GetMapping("/markets")
    public ResponseEntity<?> getMarkets() {
        try {
            String response = restTemplate.getForObject(MARKET_LIST_URL, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // 전국 시장 전체 가격 데이터 조회 (가공 없이 그대로 반환)
    @GetMapping("/trend/all")
    public ResponseEntity<?> getAllPrices(
            @RequestParam(required = false, defaultValue = "20250530") String saleDate) {

        try {
            // 전국 시장 목록 가져오기
            String marketsJson = restTemplate.getForObject(MARKET_LIST_URL, String.class);

            // 그대로 반환할 문자열 생성
            StringBuilder sb = new StringBuilder();
            sb.append("{\"date\": \"" + saleDate + "\", ");
            sb.append("\"markets\": [");

            // 시장 코드별 조회를 위해 문자열 파싱 (단순 문자열 검색)
            String[] splitRows = marketsJson.split("\"row\":");
            if (splitRows.length < 2) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("{\"error\": \"시장 데이터 파싱 실패\"}");
            }

            String rowBlock = splitRows[1];

            // 각 시장 코드 찾기
            String[] marketEntries = rowBlock.split("\\{");
            boolean first = true;

            for (String entry : marketEntries) {
                if (!entry.contains("\"WHSAL_CD\""))
                    continue;

                String code = entry.split("\"WHSAL_CD\"")[1]
                        .split("\"")[1];

                // 가격 API 호출
                String url = PRICE_DATA_URL + "?SALEDATE=" + saleDate + "&WHSALCD=" + code;
                String priceJson = restTemplate.getForObject(url, String.class);

                if (!first)
                    sb.append(",");
                sb.append(priceJson);
                first = false;
            }

            sb.append("]}");

            return ResponseEntity.ok(sb.toString());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    // 특정 시장 가격 조회 (기존 형태 유지)
    @GetMapping("/trend")
    public ResponseEntity<?> getPriceTrend(
            @RequestParam(required = false, defaultValue = "20250530") String saleDate,
            @RequestParam(required = false, defaultValue = "110001") String whsalCd) {
        try {
            String url = PRICE_DATA_URL + "?SALEDATE=" + saleDate + "&WHSALCD=" + whsalCd;
            String response = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/newtrend")
    public ResponseEntity<?> getNewTrend(
            @RequestParam(required = false, defaultValue = "2025-10-01") String p_regday,
            @RequestParam(required = false, defaultValue = "1101") String p_country_code) {
        try {
            String url = PRICE_DATA_URL2_BASE + "&p_country_code=" + p_country_code + "&p_regday=" + p_regday;
            String response = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

}