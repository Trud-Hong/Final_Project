package com.farm.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;

@Service
public class QRCodeService {

    public File generateQRCode(String url, String fileName) throws Exception {

        int width = 300;
        int height = 300;

        BitMatrix matrix = new MultiFormatWriter().encode(
                url,
                BarcodeFormat.QR_CODE,
                width,
                height);

        // 저장 경로
        File outputFile = new File("qr/" + fileName + ".png");
        outputFile.getParentFile().mkdirs();

        // File → Path 로 변환
        Path path = outputFile.toPath();

        // 이미지 생성
        MatrixToImageWriter.writeToPath(matrix, "PNG", path);

        return outputFile;
    }
}
