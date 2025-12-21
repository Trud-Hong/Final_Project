package com.farm.backend.controller;

import com.farm.backend.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    // 찜 추가 (중복 포함)
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody Map<String, String> req) {
        String userId = req.get("userId");
        String productId = req.get("productId");

        boolean added = wishlistService.addWishlist(userId, productId); // true = 신규 / false = 이미 존재

        Map<String, String> res = new HashMap<>();
        if (!added) {
            res.put("message", "already"); // 이미 찜한 상품
            return ResponseEntity.ok(res);
        }

        res.put("message", "success"); // 정상 추가
        return ResponseEntity.ok(res);
    }

    // 찜 목록 조회
    @GetMapping("/{userId}")
    public ResponseEntity<?> list(@PathVariable String userId) {
        List<?> list = wishlistService.getWishlist(userId);
        return ResponseEntity.ok(list);
    }

    // 찜 취소
    @PostMapping("/remove")
    public ResponseEntity<?> remove(@RequestBody Map<String, String> req) {
        wishlistService.removeWishlist(req.get("userId"), req.get("productId"));

        Map<String, String> res = new HashMap<>();
        res.put("message", "removed");
        return ResponseEntity.ok(res);
    }
}
