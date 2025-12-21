package com.farm.backend.product.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.ProductService;
import com.farm.backend.repository.SellerRepository;
import com.farm.backend.domain.Seller;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductPublicController {

    private final ProductService productService;
    private final SellerRepository sellerRepository;

    // 기존 전체 조회
    @GetMapping
    public Object getAllProducts() {
        return productService.findAll();
    }

    // 기존 상세 조회
    @GetMapping("/{id}")
    public Object getProductDetail(@PathVariable String id) {
        return productService.findById(id);
    }

    // 박지원 페이징
    @GetMapping("/search")
    public Page<Product> searchProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String categoryType
    ) {
        Page<Product> productPage = productService.searchProducts(page, size, categoryType);
        
        // 각 상품에 판매자 닉네임 추가
        productPage.getContent().forEach(product -> {
            if (product.getSellerId() != null) {
                // Product의 sellerId는 Seller의 userId 필드 값이므로 findByUserId 사용
                Seller seller = sellerRepository.findByUserId(product.getSellerId());
                if (seller != null && seller.getNickname() != null) {
                    product.setSellerNickname(seller.getNickname());
                }
            }
        });
        
        return productPage;
    }
}
