package com.farm.backend.product.entity;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "productReviews")
public class ProductReview {

  @Id
  private String id;
  private String productId;
  @Field("userId")
  private String userId; // 작성자 userId (권한 체크용)
  @Field("author")
  private String author; // 작성자 닉네임 (표시용)
  private int rating;
  private String content;
  private List<String> pics;
  private Instant createdAt;

  private String product; //혜정 11/26 추가함
  private String orderId; //혜정 11/28 추가함 주문번호


  public ProductReview(String productId, String userId, String author, int rating, String content, List<String> pics,
      Instant createAt, String product, String orderId) {
    this.productId = productId;

    this.userId = userId;
    this.author = author;
    this.rating = rating;
    this.content = content;
    this.pics = pics;
    this.createdAt = createAt;

    this.product = product; //혜정 11/26 추가
    this.orderId = orderId; //혜정 11/28 추가
  }

}
