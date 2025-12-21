package com.farm.backend.product.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.SeasonalService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/season")
@RequiredArgsConstructor
public class SeasonalController {

    private final SeasonalService seasonalService;

    @GetMapping("/now")
    public List<Product> getSeasonalProducts() {
        return seasonalService.getSeasonalProducts();
    }
}
