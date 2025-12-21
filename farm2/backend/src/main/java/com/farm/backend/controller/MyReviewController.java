package com.farm.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.farm.backend.domain.Member;
import com.farm.backend.product.entity.ProductReview;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.MyReviewRepository;

import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;



@RestController
@RequestMapping("api/myreview")
@RequiredArgsConstructor

public class MyReviewController {

    private final MyReviewRepository reviewRepository;
    private final MemberRepository memberRepository;

    @GetMapping("/{userId}")
    public List<ProductReview> getMyReviews(@PathVariable String userId) { //id로 리뷰 조회해
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

   
    // 리뷰신규 등록
    @PostMapping("/save")
    public String saveReview(@RequestBody ProductReview review) {

        review.setCreatedAt(Instant.now());

        System.out.println("저장할 상품명: " + review.getProduct()); //오류확인을 위해 정확하게 상품명이 들어갔는지 확인용 11/28 혜정

        // userId로 Member 조회하여 author(닉네임) 설정
        if (review.getUserId() != null && !review.getUserId().isEmpty()) {
            Optional<Member> memberOpt = memberRepository.findByUserId(review.getUserId());
            if (memberOpt.isPresent()) {
                Member member = memberOpt.get();
                // nickname이 있으면 nickname, 없으면 name 사용
                String author = member.getNickname() != null && !member.getNickname().isEmpty()
                        ? member.getNickname()
                        : (member.getName() != null ? member.getName() : review.getUserId());
                review.setAuthor(author);
                System.out.println("리뷰 작성자 닉네임 설정: " + author);
            } else {
                // Member를 찾을 수 없으면 userId를 author로 사용
                review.setAuthor(review.getUserId());
                System.out.println("Member를 찾을 수 없어 userId를 author로 사용: " + review.getUserId());
            }
        } else if (review.getAuthor() == null || review.getAuthor().isEmpty()) {
            // userId도 없고 author도 없으면 기본값 설정
            review.setAuthor("익명");
            System.out.println("userId와 author가 없어 '익명'으로 설정");
        }

        reviewRepository.save(review);        
        
        return "success";
    }
    


    
    //리뷰수정
    @PutMapping("/edit/{reviewId}")
    public String updateReview(@PathVariable String reviewId, @RequestBody ProductReview updateReq) {
        
        Optional<ProductReview> reviewOpt = reviewRepository.findById(reviewId);
        //옵셔널이라는 컨테이너안에 마이리뷰 객체가 있어. 리뷰Opt라고 부를거야
        //리뷰리포지토리에서 db에 아이디가 있는지 검색할거야.


        if (!reviewOpt.isPresent()) {
            //reviewOpt: Optional<MyReview>타입의 객체 
            //옵셔널 : 
            //isPresent: 옵셔널클래스의 메서드인데 그안에 데이터가 존재하는지 아닌지 

            return "fail";
            //그래서 리뷰가 없으면 fail처리를해
        }
        
        ProductReview review = reviewOpt.get();
        review.setContent(updateReq.getContent());
        reviewRepository.save(review);

        return "success";
    }

    //리뷰삭제
    @DeleteMapping("/delete/{reviewId}")
    public String deleteReview(@PathVariable String reviewId){

        reviewRepository.deleteById(reviewId);
        return "success";
    }
}
