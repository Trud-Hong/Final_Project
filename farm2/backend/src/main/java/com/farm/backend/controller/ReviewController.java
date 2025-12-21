package com.farm.backend.controller;

import com.farm.backend.domain.Review;
import com.farm.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 전체 리뷰 조회
    @GetMapping
    public ResponseEntity<List<Review>> getReviews() {
        List<Review> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(reviews);
    }

    // 리뷰 작성
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {

        Review saved = reviewService.saveReview(review);
        return ResponseEntity.ok(saved);
    }

    // 리뷰 수정
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @PathVariable String id,
            @RequestBody Review updatedReview) {
        Review updated = reviewService.updateReview(id, updatedReview);
        return ResponseEntity.ok(updated);
    }

    // 리뷰 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok("deleted");
    }

    // 특정 판매자 리뷰 조회 (프론트에서 사용하는 API)
    @GetMapping("/seller/{sellerUserId}")
    public ResponseEntity<List<Review>> getSellerReviews(@PathVariable String sellerUserId) {

        List<Review> reviews = reviewService.getReviewsBySellerUserId(sellerUserId);

        return ResponseEntity.ok(reviews);
    }
}
