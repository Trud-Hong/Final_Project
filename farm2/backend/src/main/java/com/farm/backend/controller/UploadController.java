package com.farm.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // backend 폴더 기준으로 /uploads/notice 에 저장
    private final Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads", "notice");

    @PostMapping("/notice-image")
    public ResponseEntity<Map<String, String>> uploadNoticeImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> result = new HashMap<>();

        if (file.isEmpty()) {
            result.put("message", "empty file");
            return new ResponseEntity<>(result, HttpStatus.BAD_REQUEST);
        }

        try {
            // 폴더 없으면 생성
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 원본 확장자
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }

            // 중복 방지 파일명
            String newFileName = UUID.randomUUID().toString() + ext;

            Path targetPath = uploadDir.resolve(newFileName);
            Files.copy(file.getInputStream(), targetPath);

            // 프론트에서 사용할 URL (예: http://localhost:8080/uploads/notice/xxx.jpg)
            String url = "/uploads/notice/" + newFileName;
            result.put("url", url);

            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (IOException e) {
            e.printStackTrace();
            result.put("message", "upload fail");
            return new ResponseEntity<>(result, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
