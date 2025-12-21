<!-- 

URL 구조 정리

구매자	GET /products	승인된 상품 목록
구매자	GET /products/{id}	상품 상세
판매자	POST /seller/products	상품 등록
판매자	PUT /seller/products/{id}	상품 수정 (재승인)
판매자	GET /seller/products/mine	내 상품 조회
관리자	GET /admin/products/pending	승인 대기 리스트
관리자	PUT /admin/products/{id}/approve	승인
관리자	DELETE /admin/products/{id}	삭제


Product(Entity)
-DB랑 1:1 대응


ProductDTO(DTO)
-클라이언트에게 보여주고 싶은 데이터만 맵핑할수 있음
-보안,성능,api 유연성이 좋음


 -->