package com.farm.backend.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "mileage")
public class Mileage {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId; // 사용자 ID

    private Long balance = 0L; // 마일리지 잔액

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

