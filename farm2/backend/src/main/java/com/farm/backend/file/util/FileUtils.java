package com.farm.backend.file.util;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileUtils {

    private final String baseDir = "C:/vscode/pro/farm2/backend/uploads/";

    public List<String> saveFiles(List<MultipartFile> files, String type) {

        List<String> urls = new ArrayList<>();

        // 업로드 폴더가 없으면 생성
        Path uploadPath = Paths.get(baseDir + type + "/");
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("폴더 생성: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("업로드 폴더 생성 실패");
            e.printStackTrace();
            return urls;
        }

        // 파일 저장
        for (MultipartFile file : files) {
            if (file.isEmpty())
                continue;

            String originalName = file.getOriginalFilename();
            String ext = originalName.substring(originalName.lastIndexOf("."));
            String saveName = UUID.randomUUID().toString() + ext;

            Path savePath = uploadPath.resolve(saveName);

            try {
                Files.copy(file.getInputStream(), savePath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("파일 저장 완료: " + savePath.toAbsolutePath());
                // 클라이언트에서 접근할 URL
                urls.add("/uploads/" + type + "/" + saveName);
            } catch (IOException e) {
                System.err.println("파일 저장 실패: " + originalName);
                e.printStackTrace();
            }
        }
        System.out.println("서버에서 반환할 URL 리스트: " + urls);
        return urls;
    }

}
