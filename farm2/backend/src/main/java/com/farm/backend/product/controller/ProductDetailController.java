package com.farm.backend.product.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.product.dto.ProductDTO;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.repository.ProductRepository;
import com.farm.backend.product.service.ProductService;
import com.farm.backend.repository.SellerRepository;
import com.farm.backend.domain.Seller;

import lombok.RequiredArgsConstructor;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductDetailController {

    private final ProductService productService;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;

    @GetMapping("/detail/{id}")
    public ProductDTO getProductDetail(@PathVariable String id) {
        Product product = productService.findById(id);
        if (product == null)
            return null;

        // 판매자 닉네임 조회
        String sellerNickname = null;
        if (product.getSellerId() != null) {
            // Product의 sellerId는 Seller의 userId 필드 값이므로 findByUserId 사용
            Seller seller = sellerRepository.findByUserId(product.getSellerId());
            if (seller != null && seller.getNickname() != null) {
                sellerNickname = seller.getNickname();
            }
        }

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .stock(product.getStock())
                .unit(product.getUnit())
                .origin(product.getOrigin())
                .originDetail(product.getOriginDetail())
                .farmingType(product.getFarmingType())
                .harvestDate(product.getHarvestDate())
                .expirationDate(product.getExpirationDate())
                .tags(product.getTags())
                .description(product.getDescription())
                .categoryType(product.getCategoryType())
                .itemType(product.getItemType())
                .images(product.getImages())
                .mainImage(product.getMainImage())
                .storageMethod(product.getStorageMethod())
                .shippingConditions(product.getShippingConditions())
                .discountRate(product.getDiscountRate())
                .discountStart(product.getDiscountStart())
                .discountEnd(product.getDiscountEnd())
                .bulkMinQuantity(product.getBulkMinQuantity())
                .bulkDiscountRate(product.getBulkDiscountRate())
                .stockWarningThreshold(product.getStockWarningThreshold())
                .shippingFreeThreshold(product.getShippingFreeThreshold())
                .additionalShippingFee(product.getAdditionalShippingFee())
                .certificates(product.getCertificates())
                .sellerId(product.getSellerId())
                .sellerName(product.getSellerName())
                .sellerNickname(sellerNickname)
                .status(product.getStatus())
                .salesCount(product.getSalesCount())
                .viewCount(product.getViewCount())
                .unitOptions(product.getUnitOptions()) // 여러 단위 옵션 추가
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    // 판매자(userId)로 등록된 상품 전체 조회
    @GetMapping("/seller/{userId}")
    public List<Product> getProductsBySeller(@PathVariable String userId) {
        return productService.findBySellerUserId(userId);
    }

    // itemType으로 상품 조회
    @GetMapping("/itemtype/{itemType}")
    public List<Product> getProductsByItemType(@PathVariable String itemType) {
        return productService.findByItemType(itemType);
    }

    @GetMapping("/related/{id}")
    public List<Product> getRelatedProducts(@PathVariable String id) {
        Product product = productService.findById(id);
        if (product == null)
            return Collections.emptyList();

        String itemType = product.getItemType();
        if (itemType == null || itemType.isEmpty())
            return Collections.emptyList();

        return productService.findByItemType(itemType).stream()
                .filter(p -> !p.getId().equals(id))
                .limit(10)
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}/view")
    public void increaseView(@PathVariable String id) {
        productService.increaseView(id);
    }

}
