package com.farm.backend.product.service;

import com.farm.backend.repository.OrderRepository;
import com.farm.backend.service.MileageService;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.farm.backend.domain.Order;
import com.farm.backend.product.dto.PaymentRequestDto;
import com.farm.backend.product.entity.Product;

import java.time.LocalDateTime;
import java.util.Map;

// KakaoPayService.java
@Service
public class KakaoPayService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final MileageService mileageService;

    private static final String KAKAO_HOST = "https://kapi.kakao.com";
    private static final String ADMIN_KEY = "d26218aeb347fa76731c41b4866e0081";

    KakaoPayService(OrderRepository orderRepository, ProductService productService, MileageService mileageService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.mileageService = mileageService;
    }

    public Map<String, Object> readyPayment(PaymentRequestDto dto, String userId) {
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "KakaoAK " + ADMIN_KEY);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("cid", "TC0ONETIME");
        params.add("partner_order_id", dto.getOrderId());
        params.add("partner_user_id", userId);
        params.add("item_name", dto.getProductName());
        params.add("quantity", String.valueOf(dto.getQuantity()));
        params.add("total_amount", String.valueOf(dto.getTotalAmount()));
        params.add("tax_free_amount", "0");
        params.add("approval_url", "http://localhost:3000/payment/complete?orderId=" + dto.getOrderId());
        params.add("cancel_url", "http://localhost:3000/");
        params.add("fail_url", "http://localhost:3000/");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map<String, Object>> response = rest.exchange(
                KAKAO_HOST + "/v1/payment/ready",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });
        return response.getBody();
    }

    public Map<String, Object> approvePayment(String tid, String pg_token, String userId, String orderId,
            PaymentRequestDto dto) {
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "KakaoAK " + ADMIN_KEY);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("cid", "TC0ONETIME");
        params.add("tid", tid);
        params.add("partner_order_id", orderId);
        params.add("partner_user_id", userId);
        params.add("pg_token", pg_token);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map<String, Object>> response = rest.exchange(
                KAKAO_HOST + "/v1/payment/approve",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        Map<String, Object> approveResult = response.getBody();
        if (approveResult == null) {
            throw new RuntimeException("카카오페이 승인 응답이 null입니다.");
        }

        String pName = dto.getProductName();
        int qty = dto.getQuantity();
        int totalPrice = dto.getTotalAmount();
        int price = totalPrice / qty;

        // 상품 정보 가져오기 (이미지 저장을 위해)
        String productId = dto.getProductId();
        String productImage = null;

        // product 변수를 if 밖에서 선언해야 scope 문제 해결됨
        Product product = null;

        if (productId != null && !productId.isEmpty()) {
            product = productService.findById(productId);

            if (product != null) {
                productImage = product.getMainImage(); // 대표 이미지 저장
                if (productImage == null && product.getImages() != null && !product.getImages().isEmpty()) {
                    productImage = product.getImages().get(0); // 대표 이미지가 없으면 첫 번째 이미지 사용
                }
            }
        }

        // 주문 저장 (상품 ID와 이미지 포함)
        Order order = new Order(userId, pName, productId, productImage, price, qty, totalPrice, LocalDateTime.now());

        // 상품 정보에서 sellerId 가져오기 (이미 위에서 가져온 product 사용)
        if (product != null && product.getSellerId() != null) {
            order.setSellerId(product.getSellerId());
        }

        // 마일리지 사용 처리
        Long mileageUsed = dto.getMileageUsed() != null ? dto.getMileageUsed() : 0L;
        if (mileageUsed > 0) {
            try {
                mileageService.useMileage(userId, mileageUsed, orderId, "상품 구매 마일리지 사용");
                order.setMileageUsed(mileageUsed);
            } catch (Exception e) {
                System.err.println("마일리지 사용 실패: " + e.getMessage());
                // 마일리지 사용 실패해도 주문은 저장 (나중에 수동 처리 가능)
            }
        }

        orderRepository.save(order);
        System.out.println("주문 저장 완료: " + order);

        // 재고 차감
        if (productId != null && !productId.isEmpty()) {
            boolean stockDecreased = productService.decreaseStock(productId, qty);
            if (!stockDecreased) {
                System.err.println("재고 차감 실패: productId=" + productId + ", quantity=" + qty);
                // 재고 차감 실패해도 주문은 저장 (나중에 수동 처리 가능)
            }
        } else {
            System.err.println("재고 차감 실패: productId가 null이거나 비어있음");
        }

        // 승인 결과 + 주문 정보 반환
        approveResult.put("order", order);
        return approveResult;
    }
}
