package com.farm.backend.product.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.farm.backend.product.dto.ProductDTO;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.entity.SeasonInfo;
import com.farm.backend.product.repository.ProductRepository;
import com.farm.backend.product.repository.SeasonInfoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final SeasonInfoRepository seasonInfoRepository;

    public Product create(ProductDTO dto, String sellerId, String sellerName) {
        Product product = Product.builder()
                .id(new ObjectId().toString())
                .name(dto.getName())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .unit(dto.getUnit())
                .origin(dto.getOrigin())
                .originDetail(dto.getOriginDetail())
                .farmingType(dto.getFarmingType())
                .harvestDate(dto.getHarvestDate())
                .expirationDate(dto.getExpirationDate())
                .tags(dto.getTags())
                .description(dto.getDescription())
                .images(dto.getImages())
                .mainImage(dto.getMainImage())
                .storageMethod(dto.getStorageMethod())
                .shippingConditions(dto.getShippingConditions())
                .discountRate(dto.getDiscountRate())
                .discountStart(dto.getDiscountStart())
                .discountEnd(dto.getDiscountEnd())
                .bulkMinQuantity(dto.getBulkMinQuantity())
                .bulkDiscountRate(dto.getBulkDiscountRate())
                .stockWarningThreshold(dto.getStockWarningThreshold())
                .shippingFreeThreshold(dto.getShippingFreeThreshold())
                .additionalShippingFee(dto.getAdditionalShippingFee())
                .certificates(dto.getCertificates())
                .sellerId(sellerId)
                .sellerName(sellerName)
                .status("approved")
                .categoryType(dto.getCategoryType())
                .itemType(dto.getItemType())
                .unitOptions(dto.getUnitOptions()) // 여러 단위 옵션 추가
                .salesCount(0)
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return productRepository.save(product);
    }

    public ProductDTO getProductByIdWithAuth(String productId, Authentication auth) {
        Product product = findById(productId);
        if (product == null)
            throw new RuntimeException("상품 없음");

        String userId = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!product.getSellerId().equals(userId) && !isAdmin) {
            throw new RuntimeException("권한 없음");
        }

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .stock(product.getStock())
                .unit(product.getUnit())
                .origin(product.getOrigin())
                .originDetail(product.getOriginDetail())
                .categoryType(product.getCategoryType())
                .itemType(product.getItemType())
                .salesCount(product.getSalesCount())
                .viewCount(product.getViewCount())

                .description(product.getDescription())
                .tags(product.getTags())
                .mainImage(product.getMainImage())
                .images(product.getImages())
                .certificates(product.getCertificates())
                .farmingType(product.getFarmingType())
                .harvestDate(product.getHarvestDate())
                .expirationDate(product.getExpirationDate())
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
                .unitOptions(product.getUnitOptions()) // 여러 단위 옵션 추가
                .build();
    }

    public List<Product> findAll() {
        return productRepository.findByStatus("approved");
    }

    public Product findById(String id) {
        return productRepository.findById(id).orElse(null);
    }

    public List<Product> findMyProducts(String sellerId) {
        return productRepository.findBySellerId(sellerId);
    }

    public Product update(Product updated, String id) {
        Product product = findById(id);
        if (product == null)
            return null;

        updated.setId(id);
        updated.setSellerId(product.getSellerId());
        updated.setSellerName(product.getSellerName());
        // 기존 status 유지 (수정 시에도 목록에 표시되도록)
        updated.setStatus(product.getStatus() != null ? product.getStatus() : "approved");
        updated.setCreatedAt(product.getCreatedAt());
        updated.setSalesCount(product.getSalesCount()); // 판매 수량 유지
        updated.setViewCount(product.getViewCount()); // 조회수 유지
        updated.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(updated);
    }

    public Product approve(String id) {
        Product product = findById(id);
        if (product == null)
            return null;

        product.setStatus("approved");
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public void delete(String id) {
        productRepository.deleteById(id);
    }

    // 박지원 페이징
    public Page<Product> searchProducts(int page, int size, String categoryType) {

        // 최신 상품이 먼저 나오도록 createdAt 내림차순 정렬
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // status가 "approved"인 상품만 반환
        // 특정 카테고리 검색
        Page<Product> result;
        if (categoryType != null && !categoryType.isEmpty()) {
            result = productRepository.findByStatusAndCategoryType("approved", categoryType, pageable);
        } else {
            // 전체 검색 (approved 상태만)
            result = productRepository.findByStatus("approved", pageable);
        }

        result.getContent().forEach(p -> {
        });

        return result;
    }

    // 판매자 ID로 상품 조회
    public List<Product> findBySellerId(String sellerId) {
        return productRepository.findBySellerId(sellerId);
    }

    // 재고 차감
    public boolean decreaseStock(String productId, int quantity) {
        try {
            Product product = findById(productId);
            if (product == null) {
                System.out.println("재고 차감 실패: 상품을 찾을 수 없습니다. productId=" + productId);
                return false;
            }
            int currentStock = product.getStock();
            if (currentStock < quantity) {
                System.out.println("재고 차감 실패: 재고 부족. 현재 재고=" + currentStock + ", 요청 수량=" + quantity);
                return false; // 재고 부족
            }
            int newStock = currentStock - quantity;
            product.setStock(newStock);
            product.setUpdatedAt(LocalDateTime.now());
            Product saved = productRepository.save(product);
            System.out.println("재고 차감 성공: productId=" + productId + ", 기존 재고=" + currentStock + ", 차감 수량=" + quantity
                    + ", 남은 재고=" + saved.getStock());
            return true;
        } catch (Exception e) {
            System.err.println("재고 차감 중 오류 발생: productId=" + productId + ", quantity=" + quantity);
            e.printStackTrace();
            return false;
        }
    }

    public List<Product> findBySellerUserId(String userId) {
        return productRepository.findBySellerId(userId);
    }

    public List<Product> getSeasonalProducts() {
        int month = LocalDateTime.now().getMonthValue();

        List<String> inSeasonItems = seasonInfoRepository.findAll()
                .stream()
                .filter(s -> s.getInSeason().contains(month))
                .map(SeasonInfo::getItemType)
                .collect(Collectors.toList());

        if (inSeasonItems.isEmpty()) {
            return Collections.emptyList();
        }

        return productRepository.findByItemTypeIn(inSeasonItems);
    }

    public List<Product> findByItemType(String itemType) {
        return productRepository.findByItemType(itemType);
    }

    // 재고 복구
    public boolean increaseStock(String productId, int quantity) {
        try {
            Product product = findById(productId);
            if (product == null) {
                System.out.println("재고 복구 실패: 상품을 찾을 수 없습니다. productId=" + productId);
                return false;
            }

            int currentStock = product.getStock();
            int newStock = currentStock + quantity;

            product.setStock(newStock);
            product.setUpdatedAt(LocalDateTime.now());

            Product saved = productRepository.save(product);
            System.out.println("재고 복구 성공: productId=" + productId
                    + ", 기존 재고=" + currentStock
                    + ", 복구 수량=" + quantity
                    + ", 최종 재고=" + saved.getStock());
            return true;

        } catch (Exception e) {
            System.err.println("재고 복구 중 오류 발생: productId=" + productId + ", quantity=" + quantity);
            e.printStackTrace();
            return false;
        }
    }

    public Product save(Product product) {
        return productRepository.save(product);
    }

    public void increaseView(String productId) {
        Product product = findById(productId);
        if (product == null)
            return;

        product.setViewCount(product.getViewCount() + 1);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    public void increaseSalesCount(String productId, int quantity) {
        Product product = findById(productId);
        if (product == null)
            return;

        product.setSalesCount(product.getSalesCount() + quantity);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    public void decreaseSalesCount(String productId, int quantity) {
        Product product = findById(productId);
        if (product == null)
            return;

        int newCount = product.getSalesCount() - quantity;
        if (newCount < 0)
            newCount = 0; // 마이너스 방지

        product.setSalesCount(newCount);
        product.setUpdatedAt(LocalDateTime.now());

        productRepository.save(product);
    }

}
