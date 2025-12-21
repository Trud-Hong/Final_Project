package com.farm.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.domain.Seller;
import com.farm.backend.domain.SellerWithdrawRequest;
import com.farm.backend.service.SellerService;
import com.farm.backend.service.SellerWithdrawRequestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seller/withdraw")
@RequiredArgsConstructor
public class SellerWithdrawController {

    private final SellerService sellerService;
    private final SellerWithdrawRequestService withdrawService;

    /** 판매자 출금 요청 */
    @PostMapping
    public ResponseEntity<?> requestWithdraw(
            @RequestBody Map<String, Object> req,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("로그인 필요");
        }

        String userId = auth.getName();
        Seller seller = sellerService.findByUserId(userId);

        if (seller == null) {
            return ResponseEntity.badRequest().body("판매자 정보가 없습니다.");
        }

        long amount = Long.parseLong(req.get("amount").toString());
        String bankName = req.get("bankName") != null ? req.get("bankName").toString() : seller.getBank();
        String accountNumber = req.get("accountNumber") != null ? req.get("accountNumber").toString() : seller.getAccountNumber();

        if (seller.getBalance() < amount) {
            return ResponseEntity.badRequest().body("정산 가능한 잔액이 부족합니다.");
        }

        // 출금 요청 생성 (SellerWithdrawRequest 기준)
        SellerWithdrawRequest request = withdrawService.createRequest(
                seller.getId(),
                amount,
                bankName,
                accountNumber);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "출금 요청이 접수되었습니다.");
        response.put("request", request);

        return ResponseEntity.ok(response);

    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body("로그인 필요");
        }

        String userId = auth.getName();
        Seller seller = sellerService.findByUserId(userId);

        if (seller == null) {
            return ResponseEntity.badRequest().body("판매자 정보를 찾을 수 없습니다.");
        }

        return ResponseEntity.ok(
                withdrawService.getRequestsBySeller(seller.getId()));
    }

}
