package com.farm.backend.product.service;

import com.farm.backend.domain.Member;
import com.farm.backend.product.dto.ProductQnARequest;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.entity.ProductQnA;
import com.farm.backend.product.repository.ProductQnaRepository;
import com.farm.backend.product.repository.ProductRepository;
import com.farm.backend.repository.MemberRepository;
import org.springframework.data.domain.Sort;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class ProductQnAService {

    private final ProductQnaRepository qnaRepository;

    private final MemberRepository memberRepository;

    private final ProductRepository productRepository;


    // 문의 생성
    public ProductQnA createQnA(String userId, String productId, ProductQnARequest req) {

        LocalDateTime now = LocalDateTime.now();

        ProductQnA qna = new ProductQnA();
        qna.setProductId(productId);

        //상품명 추가  혜정 12/4추가
        Product product = productRepository.findById(productId).orElse(null);        

        if (product != null) {
            qna.setProductName(product.getName());
        }
        // 여기까지

        qna.setUserId(userId);
        qna.setSellerId(req.getSellerId());
        qna.setTitle(req.getTitle());

        String contentText = req.getContent()  != null ? req.getContent() : req.getQuestion();

        qna.setQuestion(req.getQuestion());
        qna.setContent(req.getContent());

        qna.setPrivateFlag(req.isPrivateFlag());
        qna.setCreatedAt(now);
        qna.setUpdatedAt(now);
        qna.setPrivateFlag(req.isPrivateFlag());

        return qnaRepository.save(qna);
    }

    // ⭐ 상품별 전체 QnA 조회 (비공개 처리 추가)
    public List<ProductQnA> getQnAList(String productId, String currentUserId) {

        List<ProductQnA> list = qnaRepository.findByProductId(productId, Sort.by(Sort.Direction.DESC, "createdAt"));

        for (ProductQnA qna : list) {

            
            Member m = memberRepository.findByUserId(qna.getUserId()).orElse(null);
            qna.setAuthor(m != null ? m.getNickname() : "(알 수 없음)");           

            if (qna.isPrivateFlag()) {

                boolean isWriter = currentUserId != null && qna.getUserId().equals(currentUserId);
                boolean isSeller = currentUserId != null && qna.getSellerId().equals(currentUserId);

                if (!isWriter && !isSeller) {
                    qna.setContent("비공개 문의입니다.");
                    qna.setAnswer(null);
                }
            }
        }

        return list;
    }


    public long countUnansweredByProduct(String productId) {
        return qnaRepository.countUnansweredByProduct(productId);
    }

    public long countUnansweredBySeller(String sellerId) {
        return qnaRepository.countUnansweredBySeller(sellerId);
    }

    public List<ProductQnA> getQnABySeller(String sellerId) {
        return qnaRepository.findBySellerId(sellerId);
    }

    // 사용자별 QnA조회
    public List<ProductQnA> getQnAByUser(String userId) {
        return qnaRepository.findByUserId(userId);
    }

    public ProductQnA answerQnA(String qnaId, String answer) {
        ProductQnA qna = qnaRepository.findById(qnaId).orElse(null);
        if (qna == null) return null;

        qna.setAnswer(answer);
        qna.setUpdatedAt(LocalDateTime.now());
        qna.setAnsweredAt(LocalDateTime.now());

        return qnaRepository.save(qna);
    }

    public ProductQnA addAnswer(String qnaId, String answer) {

        ProductQnA qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new RuntimeException("QnA not found"));

        qna.setAnswer(answer);
        qna.setUpdatedAt(LocalDateTime.now());
        qna.setAnsweredAt(LocalDateTime.now());

        return qnaRepository.save(qna);
    }

    public ProductQnA getQnAById(String id) {
        return qnaRepository.findById(id).orElse(null);
    }

    public ProductQnA save(ProductQnA qna) {
        return qnaRepository.save(qna);
    }

    public void deleteQnA(String qnaId) {
        qnaRepository.deleteById(qnaId);
    }

    // 새로 추가
    public ProductQnA updateAnswer(String qnaId, String answer) {
        ProductQnA qna = qnaRepository
        .findById(qnaId).orElseThrow(() -> new RuntimeException("QnA not found"));

        qna.setAnswer(answer);
        qna.setUpdatedAt(LocalDateTime.now());
        qna.setAnsweredAt(LocalDateTime.now());

        return qnaRepository.save(qna);
    }

    public ProductQnA deleteAnswer(String qnaId) {
        ProductQnA qna = qnaRepository.findById(qnaId)
        .orElseThrow(() -> new RuntimeException("QnA not found"));

        qna.setAnswer(null);
        qna.setAnsweredAt(null);
        qna.setUpdatedAt(LocalDateTime.now());

    return qnaRepository.save(qna);
}
    
}
