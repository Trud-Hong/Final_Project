package com.farm.backend.service;

import com.farm.backend.domain.Review;
import com.farm.backend.domain.Seller;
import com.farm.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SellerService sellerService;

    // 리뷰 전체 조회 (최신순)
    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByDateDesc();
    }

    // 리뷰 저장
    public Review saveReview(Review review) {
        // 날짜 자동 세팅 (yyyy-MM-dd)
        if (review.getDate() == null || review.getDate().isEmpty()) {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            review.setDate(today);
        }

        // 판매자 정보 자동 세팅
        if (review.getSellerUserId() != null) {
            Seller seller = sellerService.findByUserId(review.getSellerUserId());

            if (seller != null) {
                review.setFarmName(seller.getFarmName());
                review.setSellerName(seller.getSellerName());
                review.setSeller(seller.getUserId());
            }
        }

        // 아바타 없으면 기본 이미지 지정
        if (review.getAvatar() == null || review.getAvatar().isEmpty()) {
            review.setAvatar("img/testimonial-1.jpg"); // 필요하면 다른 기본값으로 변경
        }

        // rating 범위 체크 (1~5)
        if (review.getRating() < 1)
            review.setRating(1);
        if (review.getRating() > 5)
            review.setRating(5);

        return reviewRepository.save(review);
    }

    // 리뷰 수정
    public Review updateReview(String id, Review updatedReview) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다."));

        // 수정 가능한 필드 세팅
        review.setRating(updatedReview.getRating());
        review.setContent(updatedReview.getContent());

        // 날짜 갱신 (수정 날짜로)
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        review.setDate(today);

        return reviewRepository.save(review);
    }

    // 리뷰 삭제
    public void deleteReview(String id) {
        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException("리뷰가 존재하지 않습니다.");
        }
        reviewRepository.deleteById(id);
    }

    // sellerUserId 기준 판매자 리뷰 조회
    public List<Review> getReviewsBySellerUserId(String sellerUserId) {
        return reviewRepository.findBySellerUserId(sellerUserId);
    }
}
