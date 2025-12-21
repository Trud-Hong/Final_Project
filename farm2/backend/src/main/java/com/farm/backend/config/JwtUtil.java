package com.farm.backend.config;

import com.farm.backend.domain.Member;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Locale;

@Component
public class JwtUtil {

    // HS256은 256비트 이상 key 필요
    private final String SECRET_KEY = "farm-secret-key-farm-secret-key-123456789012";

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // JWT 발급
    public String generateToken(Member member) {
        return Jwts.builder()
                .setSubject(member.getUserId())
                .claim("role", member.getRole().toUpperCase(Locale.ROOT))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10시간
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // JWT 검증
    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUserId(String token) {
        return validateToken(token).getSubject();
    }

    public String getRole(String token) {
        return (String) validateToken(token).get("role");
    }
}
