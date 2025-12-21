package com.farm.backend.product.controller;

import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class SeasonalProductsController {

    private final ProductService productService;

    @GetMapping("/seasonal")
    public List<Product> getSeasonalProducts() {
        return productService.getSeasonalProducts();
    }
}
