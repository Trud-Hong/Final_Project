package com.farm.backend.controller;

import com.farm.backend.config.JwtUtil;
import com.farm.backend.domain.Member;
import com.farm.backend.dto.SocialUserDto;
import com.farm.backend.service.KakaoService;
import com.farm.backend.service.NaverService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final KakaoService kakaoService;
    private final NaverService naverService;
    private final JwtUtil jwtUtil;

    // 카카오 로그인 (GET) - 리다이렉트용
    @GetMapping("/kakao")
    public ResponseEntity<SocialUserDto> kakaoLoginGet(@RequestParam String code) throws Exception {
        Member member = kakaoService.kakaoLogin(code);
        String token = jwtUtil.generateToken(member);
        return ResponseEntity.ok(new SocialUserDto(member, token));
    }

    // 네이버 로그인 (GET) - 리다이렉트용
    @GetMapping("/naver")
    public ResponseEntity<?> naverLoginGet(
            @RequestParam String code,
            @RequestParam(required = false) String state) {
        System.out.println("========================================");
        System.out.println("[네이버 로그인 시작]");
        System.out.println("받은 code: " + code);
        System.out.println("받은 state: " + state);
        System.out.println("========================================");
        
        try {
            if (state == null)
                state = "";
            
            System.out.println("[1단계] 네이버 서비스 호출 시작");
            Member member = naverService.naverLogin(code, state);
            System.out.println("[2단계] 네이버 서비스 호출 완료 - Member ID: " + member.getUserId());
            
            System.out.println("[3단계] JWT 토큰 생성 시작");
            String token = jwtUtil.generateToken(member);
            System.out.println("[4단계] JWT 토큰 생성 완료");
            
            System.out.println("[5단계] 응답 반환 준비");
            SocialUserDto response = new SocialUserDto(member, token);
            System.out.println("[6단계] 네이버 로그인 성공!");
            System.out.println("========================================");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("========================================");
            System.out.println("[에러 발생] 네이버 로그인 실패");
            System.out.println("에러 메시지: " + e.getMessage());
            System.out.println("에러 클래스: " + e.getClass().getName());
            e.printStackTrace();
            System.out.println("========================================");
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "네이버 로그인 실패: " + e.getMessage());
            errorResponse.put("errorClass", e.getClass().getName());
            if (e.getCause() != null) {
                errorResponse.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

    
    