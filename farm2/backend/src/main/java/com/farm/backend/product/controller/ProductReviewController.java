package com.farm.backend.product.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.product.dto.ProductReviewRequest;
import com.farm.backend.product.entity.ProductReview;
import com.farm.backend.product.service.ProductReviewService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products/{productId}/reviews")
public class ProductReviewController {

    private final ProductReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(
            @PathVariable String productId,
            @RequestBody ProductReviewRequest request,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        String userId = (String) authentication.getPrincipal();// JWT에서 가져옴

        return ResponseEntity.ok(reviewService.createReview(userId, productId, request));
    }

    @GetMapping
    public ResponseEntity<?> getReviews(@PathVariable String productId) {

        List<ProductReview> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable String productId,
            @PathVariable String reviewId,
            @RequestBody ProductReviewRequest request,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        String userId = (String) authentication.getPrincipal();

        try {
            ProductReview updated = reviewService.updateReview(userId, productId, reviewId, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(403).body("본인 리뷰만 수정 가능합니다.");
        } catch (Exception e) {
            return ResponseEntity.status(404).body("리뷰를 찾을 수 없습니다: " + e.getMessage());
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable String productId,
            @PathVariable String reviewId,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        String userId = (String) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        try {
            reviewService.deleteReview(userId, reviewId, isAdmin);
            return ResponseEntity.ok("리뷰가 삭제되었습니다.");
        } catch (IllegalAccessException e) {
            return ResponseEntity.status(403).body("본인 리뷰만 삭제 가능합니다.");
        } catch (Exception e) {
            return ResponseEntity.status(404).body("리뷰를 찾을 수 없습니다: " + e.getMessage());
        }
    }

}
