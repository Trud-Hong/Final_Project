package com.farm.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.backend.service.AiPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/ai-price")
@RequiredArgsConstructor
public class AIPriceController {

    private final AiPriceService aiPriceService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    /** ✔ 기존 도매가격 API */
    private final String API_URL =
            "http://211.237.50.150:7080/openapi/" +
                    "ea0273ae5fe4ac47dcf337041bb7eb869549f2409cb60964ce1cf6d9d093ff86/json/";

    /** ✔ 품목명 매핑 */
    private final Map<String, String> nameMap = new HashMap<String, String>() {{
        put("딸기", "딸기"); put("사과", "사과"); put("배", "배");
        put("포도", "포도"); put("수박", "수박"); put("참외", "참외");
        put("멜론", "멜론"); put("복숭아", "복숭아"); put("자두", "자두");
        put("감", "감"); put("귤", "감귤"); put("한라봉", "한라봉");
        put("레몬", "레몬"); put("오렌지", "오렌지"); put("블루베리", "블루베리");
        put("라즈베리", "라즈베리"); put("키위", "참다래"); put("체리", "체리");
        put("망고", "망고"); put("바나나", "바나나");

        put("배추", "배추"); put("양배추", "양배추"); put("상추", "상추");
        put("깻잎", "깻잎"); put("시금치", "시금치"); put("부추", "부추");
        put("청경채", "청경채"); put("오이", "오이"); put("토마토", "토마토");
        put("애호박", "애호박"); put("가지", "가지"); put("피망", "피망");
        put("파프리카", "파프리카"); put("고추(청양/풋)", "풋고추");
        put("대파", "대파"); put("쪽파", "쪽파"); put("양파", "양파");
        put("마늘", "마늘"); put("무", "무"); put("당근", "당근");
        put("감자", "감자"); put("고구마", "고구마");

        put("쌀", "쌀"); put("현미", "현미"); put("보리", "보리");
        put("옥수수", "옥수수");

        put("표고버섯", "표고버섯"); put("느타리버섯", "느타리버섯");
        put("팽이버섯", "팽이버섯"); put("새송이버섯", "새송이버섯");
    }};


    /** ✔ 여러 시장을 함께 조회할 리스트 */
    private static final String[] MARKETS = new String[]{
            "110001", // 가락시장
            "210001", // 부산 엄궁
            "220001", // 대구 북부
            "240001",
            "250001",
            "230001"  // 광주 각화
    };


    /**
     * ⭐ 최신 코드: 여러 시장 + 최근 30일 내 데이터 최대 7개 수집
     */
    @GetMapping("/predict-fast")
    public ResponseEntity<?> fastPredict(@RequestParam String product) {

        try {
            List<Integer> history = new ArrayList<>();
            DateTimeFormatter fmt = DateTimeFormatter.BASIC_ISO_DATE;
            LocalDate today = LocalDate.now();

            String mappedName = nameMap.get(product);
            if (mappedName == null) {
                Map<String, Object> no = new HashMap<String, Object>();
                no.put("message", "해당 품목은 지원하지 않습니다.");
                return ResponseEntity.ok(no);
            }

            // 최근 30일 동안 데이터 탐색
            for (int i = 0; i < 30 && history.size() < 7; i++) {

                String date = today.minusDays(i).format(fmt);
                List<Integer> marketPrices = new ArrayList<Integer>();

                // 여러 시장 순회
                for (int m = 0; m < MARKETS.length; m++) {
                    String whsalcd = MARKETS[m];

                    String url = API_URL +
                            "Grid_20240625000000000654_1/1/200" +
                            "?SALEDATE=" + date +
                            "&WHSALCD=" + whsalcd;

                    String json = restTemplate.getForObject(url, String.class);

                    JsonNode rows = mapper.readTree(json)
                            .path("Grid_20240625000000000654_1")
                            .path("row");

                    int price = extractDailyPrice(rows, mappedName);

                    if (price > 0) {
                        marketPrices.add(Integer.valueOf(price));
                    }
                }

                // 이날 여러 시장에서 얻은 가격 평균을 하루 데이터로 기록
                if (!marketPrices.isEmpty()) {
                    int sum = 0;
                    for (int v : marketPrices) sum += v;
                    int avg = sum / marketPrices.size();
                    history.add(avg);
                }
            }

            // 데이터 없으면 안내 메시지
            if (history.isEmpty()) {
                Map<String, Object> noData = new HashMap<String, Object>();
                noData.put("history", Collections.emptyList());
                noData.put("predict", 0);
                noData.put("message", "최근 거래 데이터가 없습니다.");
                return ResponseEntity.ok(noData);
            }

            double predicted = aiPriceService.predictPrice(product, history);

            Map<String, Object> result = new HashMap<String, Object>();
            result.put("product", product);
            result.put("history", history);
            result.put("predict", predicted);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }


    /** ✔ 하루 데이터에서 품목 가격 추출 */
    private int extractDailyPrice(JsonNode rows, String productName) {

        if (rows == null || !rows.isArray()) return -1;

        double weightedSum = 0;
        double totalQty = 0;

        for (JsonNode item : rows) {
            String mid = item.path("MIDNAME").asText("");
            String itm = item.path("ITEMNAME").asText("");

            boolean match = mid.contains(productName) || itm.contains(productName);
            if (!match) continue;

            double cost = parseSafe(item.path("COST").asText());
            double qty = parseSafe(item.path("QTY").asText());
            double kg = parseSafe(item.path("STD").asText().replaceAll("[^0-9.]", ""));

            if (qty <= 0 || kg <= 0) continue;

            double perKg = cost / kg;

            weightedSum += perKg * qty;
            totalQty += qty;
        }

        if (totalQty == 0) return -1;

        return (int) Math.round(weightedSum / totalQty);
    }

    private double parseSafe(String s) {
        try { return Double.parseDouble(s); }
        catch (Exception e) { return 0; }
    }
}
