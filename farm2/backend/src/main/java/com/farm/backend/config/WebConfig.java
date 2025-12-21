package com.farm.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

        @Override
        public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                                .allowedOriginPatterns("*")
                                .allowedMethods("*")
                                .allowedHeaders("*")
                                .allowCredentials(true);
        }

        // 파일 업로드 구성 (uploads 폴더 static 처리)
        // /uploads/파일명 URL로 직접 접근 가능
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // 지금 있는 코드 유지
                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations("file:C:/vscode/pro/farm2/backend/uploads/");

                // notice 폴더도 자동 매핑되도록 확장
                registry.addResourceHandler("/uploads/notice/**")
                                .addResourceLocations("file:C:/vscode/pro/farm2/backend/uploads/notice/");

                // QR 코드 이미지 매핑 추가 (중요)
                registry.addResourceHandler("/qr/**")
                                .addResourceLocations("file:C:/vscode/pro/farm2/backend/qr/");
        }

}
