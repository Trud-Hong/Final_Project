package com.farm.backend.product.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.product.dto.ProductReviewRequest;
import com.farm.backend.product.entity.ProductReview;
import com.farm.backend.product.repository.ProductReviewRepository;

import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final MemberRepository memberRepository;

    public ProductReview createReview(String userId, String productId, ProductReviewRequest dto) {
        // userId null 체크
        if (userId == null || userId.isEmpty()) {
            throw new RuntimeException("userId가 없습니다.");
        }

        // userId로 Member 조회하여 nickname 가져오기
        Optional<Member> memberOpt = memberRepository.findByUserId(userId);
        String author = userId; // 기본값은 userId
        
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            // nickname이 있으면 nickname, 없으면 name 사용
            if (member.getNickname() != null && !member.getNickname().isEmpty()) {
                author = member.getNickname();
            } else if (member.getName() != null && !member.getName().isEmpty()) {
                author = member.getName();
            } else {
                author = userId; // nickname과 name이 모두 없으면 userId 사용
            }
        }

        // author가 null이거나 빈 문자열인 경우 userId로 설정
        if (author == null || author.isEmpty()) {
            author = userId;
        }

        ProductReview review = new ProductReview();
        review.setProductId(productId);
        review.setUserId(userId); // userId 저장 (권한 체크용)
        review.setAuthor(author); // nickname으로 저장
        review.setRating(dto.getRating());
        review.setContent(dto.getContent());
        review.setPics(dto.getPics());
        review.setCreatedAt(Instant.now());

        review.setProduct(dto.getProduct()); // 혜정 11/26추가 상품명

        // 저장 전 author 값 확인
        System.out.println("리뷰 저장 전 author 값: " + review.getAuthor());
        System.out.println("리뷰 저장 전 userId 값: " + review.getUserId());

        ProductReview savedReview = reviewRepository.save(review);
        
        // 저장 후 author 값 확인
        System.out.println("리뷰 저장 후 author 값: " + savedReview.getAuthor());
        System.out.println("리뷰 저장 후 userId 값: " + savedReview.getUserId());

        return savedReview;
    }

    public List<ProductReview> getReviewsByProductId(String productId) {
        return reviewRepository.findByProductId(productId);
    }

    public ProductReview updateReview(String userId, String productId, String reviewId, ProductReviewRequest dto)
            throws IllegalAccessException {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰 없음"));

        // 본인 리뷰인지 확인
        // userId가 있으면 userId로 체크, 없으면 author로 체크 (기존 리뷰 호환)
        boolean isOwner = false;
        if (review.getUserId() != null && !review.getUserId().isEmpty()) {
            // userId로 체크
            isOwner = review.getUserId().equals(userId);
        } else {
            // userId가 없으면 author(nickname)로 체크
            Optional<Member> memberOpt2 = memberRepository.findByUserId(userId);
            if (memberOpt2.isPresent()) {
                Member member2 = memberOpt2.get();
                String currentNickname = member2.getNickname() != null && !member2.getNickname().isEmpty()
                        ? member2.getNickname()
                        : (member2.getName() != null ? member2.getName() : userId);
                isOwner = review.getAuthor().equals(currentNickname);
            }
        }
        
        if (!isOwner) {
            throw new IllegalAccessException("본인 리뷰만 수정 가능");
        }

        review.setRating(dto.getRating());
        review.setContent(dto.getContent());
        if (dto.getPics() != null) {
            review.setPics(dto.getPics());
        }

        return reviewRepository.save(review);
    }

    public void deleteReview(String userId, String reviewId, boolean isAdmin) throws IllegalAccessException {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰 없음"));

        // 관리자인 경우 삭제 허용
        if (isAdmin) {
            reviewRepository.delete(review);
            return;
        }

        // 본인 리뷰인지 확인
        // userId가 있으면 userId로 체크, 없으면 author로 체크 (기존 리뷰 호환)
        boolean isOwner = false;
        if (review.getUserId() != null && !review.getUserId().isEmpty()) {
            // userId로 체크
            isOwner = review.getUserId().equals(userId);
        } else {
            // userId가 없으면 author(nickname)로 체크
            Optional<Member> memberOpt = memberRepository.findByUserId(userId);
            if (memberOpt.isPresent()) {
                Member member = memberOpt.get();
                String currentNickname = member.getNickname() != null && !member.getNickname().isEmpty()
                        ? member.getNickname()
                        : (member.getName() != null ? member.getName() : userId);
                isOwner = review.getAuthor().equals(currentNickname);
            }
        }
        
        if (!isOwner) {
            throw new IllegalAccessException("본인 리뷰만 삭제 가능");
        }

        reviewRepository.delete(review);
    }

}
