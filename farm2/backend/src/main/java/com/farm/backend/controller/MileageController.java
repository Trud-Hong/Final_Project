package com.farm.backend.controller;

import com.farm.backend.domain.Mileage;
import com.farm.backend.domain.MileageTransaction;
import com.farm.backend.service.MileageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mileage")
@RequiredArgsConstructor
public class MileageController {

    private final MileageService mileageService;

    /**
     * 마일리지 잔액 조회
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        String userId = auth.getName();
        Mileage mileage = mileageService.getOrCreateMileage(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("balance", mileage.getBalance());
        response.put("userId", userId);

        return ResponseEntity.ok(response);
    }

    /**
     * 마일리지 충전
     */
    @PostMapping("/charge")
    public ResponseEntity<?> chargeMileage(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            Long amount = Long.parseLong(request.get("amount").toString());
            String description = request.getOrDefault("description", "마일리지 충전").toString();

            MileageTransaction transaction = mileageService.chargeMileage(userId, amount, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transaction", transaction);
            response.put("newBalance", transaction.getBalanceAfter());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * 마일리지 거래 내역 조회
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        String userId = auth.getName();
        List<MileageTransaction> transactions = mileageService.getTransactionHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactions);
        response.put("count", transactions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 마일리지 사용 (결제 시)
     */
    @PostMapping("/use")
    public ResponseEntity<?> useMileage(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            Long amount = Long.parseLong(request.get("amount").toString());
            String orderId = request.get("orderId").toString();
            String description = request.getOrDefault("description", "상품 구매").toString();

            MileageTransaction transaction = mileageService.useMileage(userId, amount, orderId, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transaction", transaction);
            response.put("newBalance", transaction.getBalanceAfter());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

