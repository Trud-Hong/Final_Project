<!-- 

파일 업로드 사용예시

POST http://localhost:8080/files/upload

Body → form-data → key: files multiple 체크 → 파일 선택

Response:

[
    "/uploads/uuid1.png",
    "/uploads/uuid2.jpg"
]


이렇게 받은 URL을 Product.images 필드에 저장하면 끝! -->