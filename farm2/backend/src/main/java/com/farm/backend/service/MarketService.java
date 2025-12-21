package com.farm.backend.service;

import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MarketService {
    
    private static final String CSV_FILE_PATH =  "C:\\VSCode\\pro\\farm2\\backend\\uploads\\k_farm_market.csv";
    
    public List<Map<String, String>> readMarketData() {
        // 파일 존재 여부 확인
        File csvFile = new File(CSV_FILE_PATH);
        if (!csvFile.exists()) {
            throw new RuntimeException("CSV 파일을 찾을 수 없습니다: " + CSV_FILE_PATH);
        }
        if (!csvFile.canRead()) {
            throw new RuntimeException("CSV 파일을 읽을 수 없습니다: " + CSV_FILE_PATH);
        }
        List<Map<String, String>> marketList = new ArrayList<>();
        
        // 여러 인코딩 시도 (한글 파일은 보통 MS949/EUC-KR 사용)
        Charset[] charsets = {
            Charset.forName("MS949"),      // Windows 한글 인코딩 (가장 일반적)
            Charset.forName("EUC-KR"),     // 한국어 인코딩
            Charset.forName("CP949"),      // 코드페이지 949
            StandardCharsets.UTF_8         // UTF-8
        };
        
        IOException lastException = null;
        String lastError = null;
        
        for (Charset charset : charsets) {
            marketList.clear();
            try (FileInputStream fis = new FileInputStream(CSV_FILE_PATH);
                 InputStreamReader isr = new InputStreamReader(fis, charset);
                 BufferedReader br = new BufferedReader(isr)) {
                
                // BOM 제거 (UTF-8 BOM인 경우)
                if (charset == StandardCharsets.UTF_8) {
                    fis.mark(4);
                    byte[] bom = new byte[3];
                    int bytesRead = fis.read(bom);
                    if (bytesRead == 3 && bom[0] == (byte)0xEF && bom[1] == (byte)0xBB && bom[2] == (byte)0xBF) {
                        // BOM이 있으면 이미 건너뛰어짐
                    } else {
                        fis.reset();
                    }
                }
                
                // 첫 번째 줄은 헤더
                String headerLine = br.readLine();
                if (headerLine == null) {
                    lastError = "파일이 비어있습니다.";
                    continue;
                }
                
                // BOM 문자가 남아있으면 제거
                if (headerLine.startsWith("\uFEFF")) {
                    headerLine = headerLine.substring(1);
                }
                
                // 인코딩 검증을 완화 - 헤더가 있으면 일단 시도
                String[] headers = parseCSVLine(headerLine);
                if (headers.length == 0) {
                    lastError = "헤더를 파싱할 수 없습니다. (인코딩: " + charset.name() + ")";
                    continue;
                }
                
                // 데이터 라인 읽기
                String line;
                int lineCount = 0;
                while ((line = br.readLine()) != null) {
                    if (line.trim().isEmpty()) {
                        continue;
                    }
                    
                    try {
                        String[] values = parseCSVLine(line);
                        Map<String, String> market = new HashMap<>();
                        
                        // 헤더와 값 매핑
                        for (int i = 0; i < headers.length && i < values.length; i++) {
                            market.put(headers[i].trim(), values[i].trim());
                        }
                        
                        marketList.add(market);
                        lineCount++;
                    } catch (Exception e) {
                        // 개별 라인 파싱 오류는 무시하고 계속 진행
                        System.err.println("라인 파싱 오류 (인코딩: " + charset.name() + "): " + e.getMessage());
                    }
                }
                
                // 데이터를 읽었으면 성공으로 간주
                if (lineCount > 0 || !marketList.isEmpty()) {
                    return marketList;
                } else if (headers.length > 0) {
                    // 헤더는 있지만 데이터가 없는 경우
                    lastError = "헤더는 읽었지만 데이터가 없습니다. (인코딩: " + charset.name() + ")";
                }
                
            } catch (IOException e) {
                lastException = e;
                lastError = "파일 읽기 오류 (인코딩: " + charset.name() + "): " + e.getMessage();
                continue;
            } catch (Exception e) {
                lastError = "예상치 못한 오류 (인코딩: " + charset.name() + "): " + e.getMessage();
                continue;
            }
        }
        
        // 모든 인코딩 실패 시 상세한 에러 메시지와 함께 예외 발생
        String errorMessage = "CSV 파일을 읽을 수 없습니다. ";
        if (lastError != null) {
            errorMessage += lastError;
        }
        if (lastException != null) {
            errorMessage += " 마지막 예외: " + lastException.getMessage();
        }
        throw new RuntimeException(errorMessage);
    }
    
    /**
     * 시장명으로 특정 시장 정보를 조회합니다.
     */
    public Map<String, String> getMarketByCode(String code) {
        List<Map<String, String>> allMarkets = readMarketData();
        
        // 시장명으로 필터링 (대소문자 무시, 공백 제거)
        for (Map<String, String> market : allMarkets) {
            // 시장명 필드 찾기 (다양한 필드명 지원)
            String mCode = market.get("code");
            
            if (mCode != null && mCode.trim().equals(code.trim())) {
                return market;
            }
        }
        
        throw new RuntimeException("시장을 찾을 수 없습니다: " + code);
    }
    
    
    /**
     * CSV 라인을 파싱합니다. 쉼표로 구분하되, 따옴표로 감싸진 값은 하나로 처리합니다.
     */
    private String[] parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        
        return result.toArray(new String[0]);
    }
}

