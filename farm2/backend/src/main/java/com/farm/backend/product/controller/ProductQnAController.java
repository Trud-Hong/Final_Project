package com.farm.backend.product.controller;

import com.farm.backend.product.dto.ProductQnARequest;
import com.farm.backend.product.entity.ProductQnA;
import com.farm.backend.product.service.ProductQnAService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;



@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductQnAController {

    private final ProductQnAService qnaService;

    @PostMapping("/{productId}/qna")
    public ResponseEntity<ProductQnA> createQnA(
            @PathVariable String productId,
            @RequestBody ProductQnARequest request) {

        String userId = request.getUserId();

        ProductQnA result = qnaService.createQnA(userId, productId, request);
        return ResponseEntity.ok(result);
    }

    // ⭐ userId 파라미터 반드시 받게 수정됨
    @GetMapping("/{productId}/qna")
    public ResponseEntity<List<ProductQnA>> getQnAList(
            @PathVariable String productId,
            @RequestParam(required = false) String userId
    ) {
        return ResponseEntity.ok(qnaService.getQnAList(productId, userId));
    }

    @GetMapping("/{productId}/qna/unanswered/count")
    public ResponseEntity<Long> countUnansweredByProduct(@PathVariable String productId) {
        long count = qnaService.countUnansweredByProduct(productId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/qna/seller/unanswered/count")
    public ResponseEntity<Long> countUnansweredBySeller(@RequestParam String sellerId) {
        long count = qnaService.countUnansweredBySeller(sellerId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{productId}/qna/{qnaId}/answer")
    public ResponseEntity<?> addAnswer(
            @PathVariable String productId,
            @PathVariable String qnaId,
            @RequestBody Map<String, String> body
    ) {
        String answer = body.get("answer");

        ProductQnA updated = qnaService.addAnswer(qnaId, answer);

        return ResponseEntity.ok(updated);
    }

    @GetMapping("/qna/seller")
    public ResponseEntity<List<ProductQnA>> getSellerQnA(@RequestParam String sellerId) {
        List<ProductQnA> list = qnaService.getQnABySeller(sellerId);
        return ResponseEntity.ok(list);
    }

    //qna 수정
    @GetMapping("/qna/user")
    public ResponseEntity<List<ProductQnA>> getUserQnA(@RequestParam String userId) {List<ProductQnA> list = qnaService.getQnAByUser(userId);
    return ResponseEntity.ok(list);
    }

    @PutMapping("/{productId}/qna/{qnaId}")
    public ResponseEntity<?> updateQnA(
        @PathVariable String productId,
        @PathVariable String qnaId,
        @RequestBody ProductQnARequest req) {

    ProductQnA qna = qnaService.getQnAById(qnaId);
    if (qna == null) {
        return ResponseEntity.badRequest().body("QnA not found");
    }

    qna.setTitle(req.getTitle());
    qna.setContent(req.getContent());
    qna.setQuestion(req.getContent());
    qna.setPrivateFlag(req.isPrivateFlag());
    qna.setUpdatedAt(java.time.LocalDateTime.now());

    qnaService.save(qna);
        return ResponseEntity.ok(qna);
    }

    @DeleteMapping("/{productId}/qna/{qnaId}")
    public ResponseEntity<?> deleteQnA(
        @PathVariable String productId,
        @PathVariable String qnaId) {

            ProductQnA qna = qnaService.getQnAById(qnaId);
            if (qna ==null) {
                return ResponseEntity.badRequest().body("QnA not found");
            }

            qnaService.deleteQnA(qnaId);
            return ResponseEntity.ok().body("QnA deleted successfully");
            }

            // 판매자 답변 수정
            @PutMapping("/{productId}/qna/{qnaId}/answer")
            public ResponseEntity<?> updateAnswer(
                @PathVariable String productId,
                @PathVariable String qnaId,
                @RequestBody Map<String, String> body) {
                String answer = body.get("answer");

                if(answer == null || answer.trim().isEmpty()){
                    return ResponseEntity.badRequest().body("답변 내용을 입력해주세요");
                }

                ProductQnA updated = qnaService.updateAnswer(qnaId, answer);
                
                return ResponseEntity.ok(updated);
            }

            // 답변 삭제기능
            @DeleteMapping("/{productId}/qna/{qnaId}/answer")
            public ResponseEntity<?> deleteAnswer(
                @PathVariable String productId,
                @PathVariable String qnaId
            ) {
                ProductQnA qna = qnaService.getQnAById(qnaId);
                if (qna == null) {
                    return ResponseEntity.badRequest().body("해당 문의를 찾을 수 없습니다.");}

                if (qna.getAnswer() == null || qna.getAnswer().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("삭제할 답변이 없습니다.");
                }

                ProductQnA updated = qnaService.deleteAnswer(qnaId);
                return ResponseEntity.ok(updated);
                }}

