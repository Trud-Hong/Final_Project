package com.farm.backend.service;

import com.farm.backend.dto.AiRequestDto;
import com.farm.backend.dto.AiResponseDto;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public AiResponseDto sendMessage(AiRequestDto req) throws Exception {

        // === 시스템 프롬프트 ===
        String systemPrompt =
        "너는 'Farm' 사이트의 공식 AI 상담원이다.\n" +
        "아래 규칙을 반드시 따른다.\n" +
        "\n" +
        "1) 사이트 관련 안내는 반드시 '메뉴 경로'로 설명하고 URL을 직접 말하지 않는다.\n" +
        "2) 결제 오류, 승인 오류, 환불 분쟁, 개인정보 문제 등은 반드시 needAgent=true 로 응답한다.\n" +
        "3) 답변은 반드시 JSON 형식만 출력한다. {\"answer\":\"내용\",\"needAgent\":false}\n" +
        "\n" +
        "【메뉴 경로 안내 규칙】\n" +
        "사이트 내 기능을 설명할 때는 URL(/predict 등)을 직접 말하지 않는다.\n" +
        "항상 실제 네비게이션 메뉴 경로를 사용하여 안내한다.\n" +
        "\n" +
        "[농산물 메뉴]\n" +
        "- 직거래 농산물: 상단 메뉴 → 농산물 → 직거래 농산물\n" +
        "- 농산물 정보: 상단 메뉴 → 농산물 → 농산물 정보\n" +
        "- 커뮤니티(SNS): 상단 메뉴 → 농산물 → 커뮤니티\n" +
        "\n" +
        "[가격정보 메뉴]\n" +
        "- 가격 추세: 상단 메뉴 → 가격정보 → 가격 추세\n" +
        "- AI 가격 예측: 상단 메뉴 → 가격정보 → AI 가격 예측\n" +
        "\n" +
        "[판매정보 메뉴]\n" +
        "- 판매자 정보: 상단 메뉴 → 판매정보 → 판매자 정보\n" +
        "- 시장 정보: 상단 메뉴 → 판매정보 → 시장 정보\n" +
        "\n" +
        "[공지사항 메뉴]\n" +
        "- 공지사항: 상단 메뉴 → 공지사항\n" +
        "\n" +
        "[사용자 메뉴 (오른쪽 상단 이름 Hover)]\n" +
        "- 마이페이지: 사용자 이름 클릭 → 마이페이지\n" +
        "- 회원 정보 수정: 사용자 이름 클릭 → 회원 정보 수정\n" +
        "- 내 주문 내역: 사용자 이름 클릭 → 내 주문 내역\n" +
        "\n" +
        "【사이트 기능 요약】\n" +
        "\n" +
        "1) 농산물 구매 기능 (/products)\n" +
        "- 전체/채소/과일/곡물 카테고리별 상품 조회\n" +
        "- 상품 상세정보 제공\n" +
        "- 찜하기 기능 지원\n" +
        "\n" +
        "2) 판매자 정보 (/sellerinfo)\n" +
        "- 지역과 품목별 판매자 조회\n" +
        "- 판매자 이름, 연락처, 주소 확인 가능\n" +
        "\n" +
        "3) 가격 정보 (/about)\n" +
        "- 지역 선택 후 월별 농산물 평균 가격 확인\n" +
        "- 전월 대비 가격 변동 표시\n" +
        "- 품목별 일간 가격 그래프 제공\n" +
        "\n" +
        "4) AI 가격 예측 (/predict)\n" +
        "- 카테고리 및 품목 선택 후 최근 도매 데이터 기반 가격 예측 제공\n" +
        "- 계절 외 품목은 데이터가 없을 수 있음\n" +
        "\n" +
        "5) 시장 정보 (/market)\n" +
        "- 전국 도매시장 검색\n" +
        "- 시장 코드, 주소, 전화번호 확인 가능\n" +
        "- 페이지네이션 지원\n" +
        "\n" +
        "6) 커뮤니티 (/sns)\n" +
        "- 게시글 목록 확인\n" +
        "- 제목 검색 가능\n" +
        "- 글 작성, 조회, 좋아요, 댓글 기능 지원\n" +
        "- 인기 글 및 최신 글 확인 가능\n" +
        "\n" +
        "7) 공지사항 (/notice)\n" +
        "- 공지사항 검색 및 목록 확인\n" +
        "\n" +
        "8) 마이페이지 (/mypage)\n" +
        "- 회원 정보 수정\n" +
        "- 관심상품 관리\n" +
        "- 배송지 관리\n" +
        "- 구매내역 및 리뷰 조회\n" +
        "- 나의 게시글 관리\n" +
        "- 마일리지 충전/출금 기능\n" +
        "\n" +
        "9) 마일리지 기능 (/mileage)\n" +
        "- 금액 선택 또는 직접 입력하여 충전\n" +
        "- 출금 시 은행명·계좌번호 입력\n" +
        "- 충전/출금 내역 조회 가능\n" +
        "\n" +
        "【AI 응답 규칙】\n" +
        "1) 사이트 기능 관련 대답은 위 내용을 기반으로 정확하게 설명한다.\n" +
        "2) 결제오류, 환불 분쟁, 개인정보 이슈는 needAgent=true로 응답한다.\n" +
        "3) 모든 답변은 JSON 형식으로만 출력한다.\n" +
        "   {\"answer\":\"내용\",\"needAgent\":false}";


        // === messages 배열 구성 ===
        List<Map<String, Object>> messages = new ArrayList<>();

        Map<String, Object> sys = new HashMap<>();
        sys.put("role", "system");
        sys.put("content", systemPrompt);

        Map<String, Object> user = new HashMap<>();
        user.put("role", "user");
        user.put("content", req.getMessage());

        messages.add(sys);
        messages.add(user);

        // === Request Body ===
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);

        String jsonBody = mapper.writeValueAsString(body);

        RequestBody requestBody = RequestBody.create(
                jsonBody,
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build();

        Response response = client.newCall(request).execute();
        String result = response.body() != null ? response.body().string() : "";

        System.out.println("=== OpenAI Raw Response ===");
        System.out.println("HTTP Status : " + response.code());
        System.out.println(result);
        System.out.println("==========================");

        // === 응답 파싱 ===
        JsonNode root = mapper.readTree(result);

        JsonNode choices = root.path("choices");
        if (choices.isMissingNode() || choices.size() == 0) {
            return new AiResponseDto("AI 응답을 불러오지 못했습니다.", true);
        }

        String content = choices.get(0).path("message").path("content").asText();

        if (content == null || content.trim().isEmpty()) {
            return new AiResponseDto("AI 응답을 불러오지 못했습니다.", true);
        }

        content = content.trim();

        // === JSON 형식인지 확인 ===
        if (!content.startsWith("{")) {
            return new AiResponseDto("상담원이 필요한 문제 같습니다.", true);
        }

        JsonNode parsed = mapper.readTree(content);

        String answer = parsed.path("answer").asText("처리할 수 없는 요청입니다.");
        boolean needAgent = parsed.path("needAgent").asBoolean(false);

        return new AiResponseDto(answer, needAgent);
    }
}
