package com.farm.backend.product.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.ProductService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
public class ProductAdminController {

    // 관리자용 컨트롤러

    private final ProductService productService;

    @GetMapping("/pending")
    public List<Product> getPendingProducts() {
        return productService.findMyProducts("pending");
    }

    @PutMapping("/{id}/approve")
    public Product approveProduct(@PathVariable String id) {
        return productService.approve(id);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id) {
        productService.delete(id);
    }

}
