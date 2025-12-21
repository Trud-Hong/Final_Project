package com.farm.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KakaoService {

    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 카카오 로그인 (code → Member 리턴)
    public Member kakaoLogin(String code) throws Exception {

        RestTemplate rt = new RestTemplate();

        // 1) Access Token 요청
        String tokenUrl = "https://kauth.kakao.com/oauth/token" +
                "?grant_type=authorization_code" +
                "&client_id=96a4a7dfe35ee2e71a6d030c21bfacec" +
                "&redirect_uri=http://localhost:3000/oauth/kakao" +
                "&code=" + code;

        String tokenResult = rt.postForObject(tokenUrl, null, String.class);
        JsonNode tokenJson = objectMapper.readTree(tokenResult);

        if (!tokenJson.has("access_token")) {
            throw new RuntimeException("카카오 Access Token 발급 실패: " + tokenResult);
        }

        String accessToken = tokenJson.get("access_token").asText();

        // 2) 사용자 정보 요청
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<String> userResponse = rt.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                entity,
                String.class);

        JsonNode profile = objectMapper.readTree(userResponse.getBody());
        String kakaoId = profile.get("id").asText();

        // ✅ 닉네임
        String nickname = "카카오사용자";

        JsonNode kakaoAccount = profile.get("kakao_account");
        if (kakaoAccount != null && kakaoAccount.has("profile")) {
            JsonNode kakaoProfile = kakaoAccount.get("profile");
            if (kakaoProfile != null && kakaoProfile.has("nickname")) {
                nickname = kakaoProfile.get("nickname").asText();
            }
        }

        if ("카카오사용자".equals(nickname)) {
            JsonNode properties = profile.get("properties");
            if (properties != null && properties.has("nickname")) {
                nickname = properties.get("nickname").asText();
            }
        }

        // ✅ 이메일
        String email = null;
        if (kakaoAccount != null && kakaoAccount.has("email")) {
            // 카카오 동의항목에서 이메일 허용한 경우
            email = kakaoAccount.get("email").asText();
        } else {

            email = kakaoId + "@kakao.com";
        }

        // 3) DB 저장 or 기존 회원 로그인
        Optional<Member> memberOpt = memberRepository.findByUserId(kakaoId);
        Member member = memberOpt.orElse(new Member());

        member.setUserId(kakaoId);
        member.setNickname(nickname);
        member.setName(nickname);
        member.setProvider("kakao");
        member.setEmail(email);

        memberRepository.save(member);

        return member;
    }
}
