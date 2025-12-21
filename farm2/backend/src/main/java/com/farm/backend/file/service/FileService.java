package com.farm.backend.file.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.farm.backend.file.util.FileUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileUtils fileUtils;

    public List<String> saveFiles(List<MultipartFile> files, String type) {
        return fileUtils.saveFiles(files, type);
    }

}
