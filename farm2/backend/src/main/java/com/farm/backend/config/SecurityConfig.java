package com.farm.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors().and() // <-- corsConfigurationSource() 사용
                .csrf().disable()
                .formLogin().disable()
                .authorizeHttpRequests(auth -> auth
                        .antMatchers("/seller/products", "/seller/products/**")
                        .hasAnyAuthority("ROLE_SELLER", "ROLE_ADMIN")
                        .antMatchers("/payment/**").hasAnyAuthority("ROLE_USER", "ROLE_SELLER", "ROLE_ADMIN")
                        .antMatchers("/mypage/**").authenticated()
                        // .antMatchers("/api/orders/**").hasAnyAuthority("ROLE_USER", "ROLE_SELLER",
                        // "ROLE_ADMIN")

                        .anyRequest().permitAll())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ★ 여기 필수 ★
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.addAllowedOriginPattern("*"); // 모든 IP 프론트 접근 허용
        config.addAllowedHeader("*");
        config.addExposedHeader("Authorization"); // JWT 헤더 허용
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
