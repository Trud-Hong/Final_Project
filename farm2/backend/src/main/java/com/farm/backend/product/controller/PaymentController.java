package com.farm.backend.product.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.farm.backend.product.dto.PaymentRequestDto;
import com.farm.backend.product.service.KakaoPayService;

import java.util.Map;

import javax.servlet.http.HttpSession;

// PaymentController.java
@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final KakaoPayService kakaoPayService;

    @PostMapping("/ready")
    public ResponseEntity<?> readyPayment(@RequestBody PaymentRequestDto dto, Authentication auth,
            HttpSession session) {
        if (auth == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        String userId = auth.getName();
        Map<String, Object> readyResponse = kakaoPayService.readyPayment(dto, userId);

        // tid 세션에 저장
        String tid = (String) readyResponse.get("tid");
        session.setAttribute("tid", tid);

        return ResponseEntity.ok(readyResponse);
    }

    @PostMapping("/approve")
    public ResponseEntity<?> approvePayment(
            @RequestParam String tid,
            @RequestParam String pg_token,
            @RequestParam("orderId") String orderId,
            @RequestBody PaymentRequestDto dto,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");

        String userId = auth.getName();
        return ResponseEntity.ok(kakaoPayService.approvePayment(tid, pg_token, userId, orderId, dto));
    }
}
