package com.farm.backend.product.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.domain.Seller;
import com.farm.backend.product.dto.ProductDTO;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.ProductService;
import com.farm.backend.service.SellerService;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/seller/products")
@RequiredArgsConstructor
public class ProductSellerController {

    // 판매자용 컨트롤러
    @Autowired
    private SellerService sellerService;
    private final ProductService productService;

    @PostMapping
    public Product createProduct(@RequestBody ProductDTO productDTO,
            Authentication auth) {

        if (auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER") || a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 1) 로그인한 userId 가져오기
        String userId = auth.getName();

        // 2) userId로 seller 정보를 가져옴
        Seller seller = sellerService.findByUserId(userId);
        if (seller == null) {
            throw new RuntimeException("판매자 정보를 찾을 수 없습니다.");
        }

        // 3) Product에 저장할 sellerId는 '판매자 문서의 ObjectId'
        String sellerId = seller.getUserId();
        // 3) Product에 저장할 sellerId는 Member의 userId (일관성 유지)
        
        String sellerName = seller.getNickname(); // 또는 sellerName

        return productService.create(productDTO, sellerId, sellerName);
    }

    @GetMapping("/id/{productId}")
    public ProductDTO getProduct(@PathVariable String productId, Authentication auth) {
        return productService.getProductByIdWithAuth(productId, auth);
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable String id,
            @RequestBody ProductDTO productDTO,
            Authentication auth) {
        
        // 권한 체크
        if (auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER") || a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("권한이 없습니다.");
        }
        
        // 본인 상품인지 확인
        String userId = auth.getName();
        Product existingProduct = productService.findById(id);
        if (existingProduct == null) {
            throw new RuntimeException("상품이 존재하지 않습니다.");
        }
        
        if (!existingProduct.getSellerId().equals(userId)) {
            throw new RuntimeException("본인 상품만 수정할 수 있습니다.");
        }
        
        // ProductDTO를 Product로 변환
        Product product = Product.builder()
                .id(id)
                .name(productDTO.getName())
                .price(productDTO.getPrice())
                .stock(productDTO.getStock())
                .unit(productDTO.getUnit())
                .origin(productDTO.getOrigin())
                .originDetail(productDTO.getOriginDetail())
                .farmingType(productDTO.getFarmingType())
                .harvestDate(productDTO.getHarvestDate())
                .expirationDate(productDTO.getExpirationDate())
                .tags(productDTO.getTags())
                .description(productDTO.getDescription())
                .images(productDTO.getImages())
                .mainImage(productDTO.getMainImage())
                .storageMethod(productDTO.getStorageMethod())
                .shippingConditions(productDTO.getShippingConditions())
                .discountRate(productDTO.getDiscountRate())
                .discountStart(productDTO.getDiscountStart())
                .discountEnd(productDTO.getDiscountEnd())
                .bulkMinQuantity(productDTO.getBulkMinQuantity())
                .bulkDiscountRate(productDTO.getBulkDiscountRate())
                .stockWarningThreshold(productDTO.getStockWarningThreshold())
                .shippingFreeThreshold(productDTO.getShippingFreeThreshold())
                .additionalShippingFee(productDTO.getAdditionalShippingFee())
                .certificates(productDTO.getCertificates())
                .categoryType(productDTO.getCategoryType())
                .itemType(productDTO.getItemType())
                .unitOptions(productDTO.getUnitOptions()) // 여러 단위 옵션 추가
                .build();

        return productService.update(product, id);
    }

    @GetMapping("/mine")
    public List<Product> getMyProducts(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER") || a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("권한이 없습니다.");
        }

        String sellerId = auth.getName();
        return productService.findMyProducts(sellerId);
    }

    @GetMapping("/list/{sellerId}")
    public List<ProductDTO> getProductsBySeller(@PathVariable String sellerId) {
        List<Product> products = productService.findBySellerId(sellerId);

        return products.stream().map(product -> ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .sellerId(product.getSellerId())
                .sellerName(product.getSellerName())
                .price(product.getPrice())
                .stock(product.getStock())
                .unit(product.getUnit())
                .origin(product.getOrigin())
                .originDetail(product.getOriginDetail())
                .farmingType(product.getFarmingType())
                .harvestDate(product.getHarvestDate())
                .expirationDate(product.getExpirationDate())
                .categoryType(product.getCategoryType())
                .itemType(product.getItemType())
                .description(product.getDescription())
                .tags(product.getTags())
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
                .unitOptions(product.getUnitOptions()) // 여러 단위 옵션 추가
                .status(product.getStatus())
                .salesCount(product.getSalesCount())
                .viewCount(product.getViewCount())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build()).collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER") || a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("권한이 없습니다");
        }

        String sellerId = auth.getName();
        Product product = productService.findById(id);
        if (product == null) {
            throw new RuntimeException("상품이 존재하지 않습니다");
        }
        if (!product.getSellerId().equals(sellerId)) {
            throw new RuntimeException("본인 상품만 삭제할 수 있습니다.");
        }

        productService.delete(id);
    }

    @PutMapping("/{id}/status")
    public Product updateProductStatus(
            @PathVariable String id,
            @RequestParam String status,
            Authentication auth) {

        // 권한 체크
        if (auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER") || a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("권한이 없습니다.");
        }

        String sellerId = auth.getName();
        Product product = productService.findById(id);

        if (product == null) {
            throw new RuntimeException("상품이 존재하지 않습니다.");
        }

        if (!product.getSellerId().equals(sellerId)) {
            throw new RuntimeException("본인 상품만 상태 변경할 수 있습니다.");
        }

        // 상태 변경
        product.setStatus(status);
        return productService.save(product);
    }

}