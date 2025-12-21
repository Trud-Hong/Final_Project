package com.farm.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiPriceService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;   // gpt-4o-mini 또는 gpt-4o

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public double predictPrice(String product, List<Integer> recentPrices) throws Exception {

        // 🔸 AI에게 줄 시스템 프롬프트 (역할 정의)
        String systemPrompt =
                "너는 한국 농산물 도매시장 가격을 분석하고 예측하는 전문 인공지능이다.\n" +
                "입력된 최근 가격 데이터를 기반으로 내일의 전국 평균 도매가격을 예측해라.\n" +
                "숫자만 정확히 반환해. 단위는 원이다. 다른 문장은 쓰지 마라.";

        // 🔸 AI에게 전달할 사용자 프롬프트 (실제 데이터)
        String userPrompt =
                "품목: " + product + "\n" +
                "최근 7일 가격 데이터: " + recentPrices + "\n" +
                "내일 예상 평균 가격을 '숫자만' 출력해줘.";


        // 🔸 OpenAI 요청 바디 구성
        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("model", model);
        bodyMap.put("messages", Arrays.asList(
                new HashMap<String, String>() {{
                    put("role", "system");
                    put("content", systemPrompt);
                }},
                new HashMap<String, String>() {{
                    put("role", "user");
                    put("content", userPrompt);
                }}
        ));
        bodyMap.put("max_tokens", 50);

        String json = mapper.writeValueAsString(bodyMap);


        // 🔸 HTTP 요청
        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .post(body)
                .build();

        // 🔸 응답 처리
        Response response = client.newCall(request).execute();
        String result = response.body().string();

        JsonNode root = mapper.readTree(result);
        String aiContent = root.path("choices").get(0).path("message").path("content").asText().trim();


        // 🔸 숫자만 깔끔하게 추출
        try {
            return Double.parseDouble(aiContent.replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            // 🔸 fallback: 가격 평균값(문제 발생 시 안정성 확보)
            return fallback(recentPrices);
        }
    }



    /**
     * 예비(백업) 예측값 — AI 오류 시 평균값 반환
     */
    private double fallback(List<Integer> prices) {
        return prices.stream().mapToDouble(v -> v).average().orElse(0);
    }
}
