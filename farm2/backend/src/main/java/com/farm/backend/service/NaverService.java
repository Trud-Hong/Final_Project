package com.farm.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NaverService {

    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Member naverLogin(String code, String state) throws Exception {
        System.out.println("[NaverService] 네이버 로그인 시작 - code: " + code + ", state: " + state);

        RestTemplate rt = new RestTemplate();

        // 1) 네이버 Access Token 요청 (POST 방식)
        String tokenUrl = "https://nid.naver.com/oauth2.0/token";

        // POST 요청을 위한 파라미터 설정
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", "b3OBagSlwW4Riy478hl0");
        params.add("client_secret", "hURfwxHrsB");
        params.add("redirect_uri", "http://localhost:3000/oauth/naver");
        params.add("code", code);
        params.add("state", state != null ? state : "");

        System.out.println("[NaverService] 토큰 요청 URL: " + tokenUrl);
        System.out.println("[NaverService] 요청 파라미터:");
        System.out.println("  - grant_type: authorization_code");
        System.out.println("  - client_id: b3OBagSlwW4Riy478hl0");
        System.out.println("  - redirect_uri: http://localhost:3000/oauth/naver");
        System.out.println("  - code: " + code);
        System.out.println("  - state: " + (state != null ? state : ""));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        System.out.println("[NaverService] 네이버 토큰 API 호출 시작...");
        ResponseEntity<String> tokenResponse = rt.exchange(
                tokenUrl,
                HttpMethod.POST,
                request,
                String.class);

        System.out.println("[NaverService] 네이버 토큰 API 응답 상태: " + tokenResponse.getStatusCode());
        String tokenResult = tokenResponse.getBody();
        System.out.println("[NaverService] 네이버 토큰 API 응답 본문: " + tokenResult);

        if (tokenResult == null || tokenResult.isEmpty()) {
            System.out.println("[NaverService] 에러: 토큰 응답이 비어있습니다.");
            throw new RuntimeException("네이버 Access Token 요청 실패: 응답이 비어있습니다.");
        }

        // JSON 파싱 시도
        JsonNode tokenJson;
        try {
            System.out.println("[NaverService] 토큰 응답 JSON 파싱 시도...");
            tokenJson = objectMapper.readTree(tokenResult);
            System.out.println("[NaverService] 토큰 응답 JSON 파싱 성공");
        } catch (Exception e) {
            System.out.println("[NaverService] 에러: 토큰 응답 JSON 파싱 실패 - " + e.getMessage());
            throw new RuntimeException("네이버 Access Token 응답 파싱 실패: " + tokenResult, e);
        }

        if (!tokenJson.has("access_token")) {
            String error = tokenJson.has("error") ? tokenJson.get("error").asText() : "알 수 없는 오류";
            String errorDescription = tokenJson.has("error_description") ? tokenJson.get("error_description").asText()
                    : "";
            System.out.println("[NaverService] 에러: Access Token이 없습니다.");
            System.out.println("[NaverService] 에러 코드: " + error);
            System.out.println("[NaverService] 에러 설명: " + errorDescription);
            throw new RuntimeException("네이버 Access Token 발급 실패: " + error + " - " + errorDescription);
        }

        String accessToken = tokenJson.get("access_token").asText();
        System.out.println("[NaverService] Access Token 획득 성공 (길이: " + accessToken.length() + ")");

        // 2) 사용자 정보 요청
        System.out.println("[NaverService] 사용자 정보 API 호출 시작...");
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.add("Authorization", "Bearer " + accessToken);
        HttpEntity<?> entity = new HttpEntity<>(userHeaders);

        ResponseEntity<String> userResponse = rt.exchange(
                "https://openapi.naver.com/v1/nid/me",
                HttpMethod.GET,
                entity,
                String.class);

        System.out.println("[NaverService] 사용자 정보 API 응답 상태: " + userResponse.getStatusCode());
        String userResponseBody = userResponse.getBody();
        System.out.println("[NaverService] 사용자 정보 API 응답 본문: " + userResponseBody);

        if (userResponseBody == null || userResponseBody.isEmpty()) {
            System.out.println("[NaverService] 에러: 사용자 정보 응답이 비어있습니다.");
            throw new RuntimeException("네이버 사용자 정보 조회 실패: 응답이 비어있습니다.");
        }

        JsonNode profile;
        try {
            System.out.println("[NaverService] 사용자 정보 JSON 파싱 시도...");
            profile = objectMapper.readTree(userResponseBody);
            System.out.println("[NaverService] 사용자 정보 JSON 파싱 성공");
        } catch (Exception e) {
            System.out.println("[NaverService] 에러: 사용자 정보 JSON 파싱 실패 - " + e.getMessage());
            throw new RuntimeException("네이버 사용자 정보 응답 파싱 실패: " + userResponseBody, e);
        }

        if (!profile.has("response")) {
            System.out.println("[NaverService] 에러: 응답에 'response' 필드가 없습니다.");
            throw new RuntimeException("네이버 사용자 정보 조회 실패: 응답 데이터가 올바르지 않습니다. " + userResponseBody);
        }

        JsonNode response = profile.get("response");

        if (!response.has("id")) {
            System.out.println("[NaverService] 에러: 응답에 'id' 필드가 없습니다.");
            throw new RuntimeException("네이버 사용자 정보 조회 실패: 사용자 ID를 찾을 수 없습니다. " + userResponseBody);
        }

        String naverId = response.get("id").asText();
        String name = response.has("name") ? response.get("name").asText() : "네이버사용자";
        String nickname = response.has("nickname") ? response.get("nickname").asText() : "네이버사용자";
        String email = response.has("email") ? response.get("email").asText() : null;

        System.out.println("[NaverService] 사용자 정보 추출 완료:");
        System.out.println("  - naverId: " + naverId);
        System.out.println("  - name: " + name);
        System.out.println("  - nickname: " + nickname);
        System.out.println("  - email: " + (email != null ? email : "없음"));

        // 3) DB 저장 또는 기존 로그인
        System.out.println("[NaverService] DB에서 기존 회원 조회 시작...");
        Optional<Member> memberOpt = memberRepository.findByUserId(naverId);
        Member member = memberOpt.orElse(null);

        if (member == null) {
            System.out.println("[NaverService] 신규 회원 - DB에 저장 시작...");
            member = new Member();
            member.setUserId(naverId);
            member.setName(name);
            member.setNickname(nickname);
            member.setProvider("naver");

            if (email != null) {
                member.setEmail(email);
            } else {
                member.setEmail(naverId + "@naver-social.com");
            }

            memberRepository.save(member);
            System.out.println("[NaverService] 신규 회원 DB 저장 완료");
        } else {
            System.out.println("[NaverService] 기존 회원 발견 - ID: " + member.getId());
        }

        System.out.println("[NaverService] 네이버 로그인 처리 완료");
        return member;
    }
}
