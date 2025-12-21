package com.farm.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.farm.backend.domain.Cart;
import com.farm.backend.service.CartService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/cart") // 기본 URL설정 http://localhost:8080/api/cart
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");
            String productId = (String) request.get("productId");
            String productName = (String) request.get("productName");
            String productImage = (String) request.get("productImage");
            int qty = (Integer) request.get("qty");
            int price = (Integer) request.get("price");
            String selectedUnit = request.get("selectedUnit") != null ? (String) request.get("selectedUnit") : null;
            String selectedUnitProductName = request.get("selectedUnitProductName") != null
                    ? (String) request.get("selectedUnitProductName")
                    : null;

            Cart cart = cartService.addToCart(userId, productId, productName, productImage, qty, price, selectedUnit,
                    selectedUnitProductName);

            return ResponseEntity.ok(cart); // 성공상태와 같이 카트내용을 보내

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // 장바구니 목록조회
    @GetMapping("/{userId}")
    public ResponseEntity<List<Cart>> getCart(@PathVariable String userId) {
        try {

            List<Cart> cartList = cartService.getCartByUserId(userId);
            return ResponseEntity.ok(cartList);

        } catch (Exception e) {

            return ResponseEntity.badRequest().build();
        }
    }

    // 수량변경
    @PutMapping("/update/{cartId}")
    public ResponseEntity<Cart> updateQty(
            @PathVariable String cartId,
            @RequestParam int qty) {
        try {
            Cart cart = cartService.updateQty(cartId, qty);
            return ResponseEntity.ok(cart);

        } catch (Exception e) {

            return ResponseEntity.badRequest().build();
        }
    }

    // 옵션 변경
    @PutMapping("/update-option/{cartId}")
    public ResponseEntity<?> updateOption(
            @PathVariable String cartId,
            @RequestBody Map<String, Object> request) {
        try {

            String selectedUnit = (String) request.get("selectedUnit");
            String selectedUnitProductName = (String) request.get("selectedUnitProductName");
            Integer price = request.get("price") != null ? ((Number) request.get("price")).intValue() : null;

            Cart cart = cartService.updateOption(cartId, selectedUnit, selectedUnitProductName, price);
            return ResponseEntity.ok(cart);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "옵션 변경 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // 삭제 (일부)
    @DeleteMapping("/delete/{cartId}")
    public ResponseEntity<String> deleteCartItem(@PathVariable String cartId) {
        try {

            cartService.deleteCartItem(cartId);
            return ResponseEntity.ok("삭제완료");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("삭제실패");
        }
    }

    // 전체 삭제
    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<String> clearCart(@PathVariable String userId) {

        try {

            cartService.clearCart(userId);
            return ResponseEntity.ok("장바구니 비우기 완료");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("실패");
        }
    }

    @PostMapping("/from-wishlist")
    public ResponseEntity<?> moveFromWishListToCart(@RequestBody Map<String, String> req) {

        String userId = req.get("userId");
        String productId = req.get("productId");

        cartService.moveFromWishListToCart(userId, productId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "장바구니로 이동했습니다");
        return ResponseEntity.ok(response);
    }

}
