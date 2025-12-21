package com.farm.backend.product.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.farm.backend.product.entity.Product;

import org.springframework.data.domain.Pageable;

public interface ProductRepository extends MongoRepository<Product, String> {

    // 물품 저장소

    List<Product> findBySellerId(String sellerId);

    List<Product> findByStatus(String status);

    List<Product> findByCategory(String category); // 레거시 호환용 (deprecated)

    List<Product> findByCategoryType(String categoryType);

    List<Product> findByItemTypeIn(List<String> itemTypes);

    List<Product> findByItemType(String itemType);

    // 박지원 패이징
    Page<Product> findByCategory(String category, Pageable pageable); // 레거시 호환용 (deprecated)

    Page<Product> findByCategoryType(String categoryType, Pageable pageable);

    Page<Product> findAll(Pageable pageable);
    
    // status 필터링을 위한 페이징 메서드
    Page<Product> findByStatus(String status, Pageable pageable);
    
    Page<Product> findByStatusAndCategoryType(String status, String categoryType, Pageable pageable);

}
