package com.farm.backend.file.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.farm.backend.file.service.FileService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("type") String type) {

        System.out.println("파일 업로드 요청, 파일 수: " + files.size());
        files.forEach(f -> System.out.println("파일명: " + f.getOriginalFilename()));

        List<String> urls = fileService.saveFiles(files, type);
        System.out.println("업로드 후 URL: " + urls);

        return ResponseEntity.ok(urls);
    }

}
