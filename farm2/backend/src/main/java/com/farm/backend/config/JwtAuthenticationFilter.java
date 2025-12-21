package com.farm.backend.config;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println("[JwtFilter] Extracted Token: " + token);
            try {
                Claims claims = jwtUtil.validateToken(token);
                System.out.println("[JwtFilter] Claims: " + claims); // 토큰 내용 확인
                String userId = claims.getSubject();
                String role = (String) claims.get("role");
                System.out.println("[JwtFilter] Extracted userId: " + userId);
                System.out.println("[JwtFilter] Extracted role: " + role);
                System.out.println("[JwtFilter] Role equals ROLE_SELLER? " + "ROLE_SELLER".equals(role));

                // Spring Security Authentication 객체 생성
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.singletonList(authority));

                SecurityContextHolder.getContext().setAuthentication(auth);
                System.out.println("[JwtFilter] SecurityContext authentication set: " +
                        SecurityContextHolder.getContext().getAuthentication());

            } catch (Exception e) {
                System.out.println("[JwtFilter] Token validation failed: " + e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("유효하지 않은 토큰입니다.");
                return;
            }
        } else {
        }

        filterChain.doFilter(request, response);
    }
}
