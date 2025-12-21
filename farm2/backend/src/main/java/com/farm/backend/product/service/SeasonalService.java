package com.farm.backend.product.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.farm.backend.product.entity.Product;
import com.farm.backend.product.entity.SeasonInfo;
import com.farm.backend.product.repository.ProductRepository;
import com.farm.backend.product.repository.SeasonInfoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SeasonalService {

    private final SeasonInfoRepository seasonInfoRepository;
    private final ProductRepository productRepository;

    public List<Product> getSeasonalProducts() {

        int month = LocalDate.now().getMonthValue();

        // 제철 info에서 현재 월에 포함되는 item 리스트 가져오기
        List<String> inSeasonItems = seasonInfoRepository.findAll()
                .stream()
                .filter(s -> s.getInSeason().contains(month))
                .map(SeasonInfo::getItemType)
                .collect(Collectors.toList());

        if (inSeasonItems.isEmpty()) {
            return Collections.emptyList(); // Java 8 OK
        }

        return productRepository.findByItemTypeIn(inSeasonItems);
    }

}
