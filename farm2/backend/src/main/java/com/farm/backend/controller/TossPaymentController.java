package com.farm.backend.controller;

import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.service.MileageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/toss-payment")
@RequiredArgsConstructor
public class TossPaymentController {

    private final MileageService mileageService;
    private final MemberRepository memberRepository;
    
    private static final String SECRET_KEY = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

    /**
     * 토스페이먼츠 결제 승인 (마일리지 충전)
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            String paymentKey = (String) request.get("paymentKey");
            String orderId = (String) request.get("orderId");
            Long amount = Long.parseLong(request.get("amount").toString());

            // 토스페이먼츠 결제 승인 API 호출
            Map<String, Object> confirmResult = confirmTossPayment(paymentKey, orderId, amount);

            if (confirmResult != null && confirmResult.containsKey("status") && 
                "DONE".equals(confirmResult.get("status"))) {
                
                // 마일리지 충전 처리
                mileageService.chargeMileage(
                    userId,
                    amount,
                    "토스페이먼츠 충전 - 주문번호: " + orderId
                );

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "마일리지 충전이 완료되었습니다.");
                response.put("amount", amount);
                response.put("orderId", orderId);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("결제 승인에 실패했습니다.");
            }
        } catch (Exception e) {
            System.err.println("토스페이먼츠 결제 승인 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("결제 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 토스페이먼츠 결제 승인 API 호출
     */
    private Map<String, Object> confirmTossPayment(String paymentKey, String orderId, Long amount) {
        try {
            org.springframework.web.client.RestTemplate rest = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            
            // Base64 인코딩된 시크릿 키
            String encodedSecretKey = java.util.Base64.getEncoder()
                .encodeToString((SECRET_KEY + ":").getBytes());
            headers.add("Authorization", "Basic " + encodedSecretKey);
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("paymentKey", paymentKey);
            requestBody.put("orderId", orderId);
            requestBody.put("amount", amount);

            org.springframework.http.HttpEntity<Map<String, Object>> request = 
                new org.springframework.http.HttpEntity<>(requestBody, headers);

            org.springframework.core.ParameterizedTypeReference<Map<String, Object>> responseType =
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {};

            org.springframework.http.ResponseEntity<Map<String, Object>> response = rest.exchange(
                "https://api.tosspayments.com/v1/payments/confirm",
                org.springframework.http.HttpMethod.POST,
                request,
                responseType
            );

            return response.getBody();
        } catch (Exception e) {
            System.err.println("토스페이먼츠 API 호출 오류: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 사용자의 customerKey 조회
     */
    @GetMapping("/customer-key")
    public ResponseEntity<?> getCustomerKey(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

            String customerKey = member.getCustomerKey();
            if (customerKey == null || customerKey.isEmpty()) {
                customerKey = java.util.UUID.randomUUID().toString().replace("-", "");
                member.setCustomerKey(customerKey);
                memberRepository.save(member);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("customerKey", customerKey);
            response.put("userId", userId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("customerKey 조회 중 오류가 발생했습니다.");
        }
    }
}

