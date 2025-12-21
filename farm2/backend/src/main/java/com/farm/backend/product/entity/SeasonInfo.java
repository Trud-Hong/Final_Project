package com.farm.backend.product.entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "season_info")
public class SeasonInfo {
    @Id
    private String id;

    private String itemType; // 딸기 / 사과 / 수박 …
    private String categoryType; // fruit / vegetable / grain
    private List<Integer> inSeason; // [1,2,3] → 제철 월
}
