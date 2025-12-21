package com.farm.backend.domain;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "wishlist")
public class Wishlist {

    @Id
    private String id;

    private String userId;
    private String productId;
    private LocalDateTime createdAt;
}
