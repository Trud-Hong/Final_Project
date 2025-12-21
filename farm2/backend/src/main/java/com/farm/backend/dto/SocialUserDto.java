package com.farm.backend.dto;

import com.farm.backend.domain.Member;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SocialUserDto {
    private Member member;
    private String token;
    private String provider; // kakao, naver 등
    private String providerId; // 소셜 고유 ID
    private String email; // 소셜 이메일
    private String name; // 화면 표시용 이름
    private String nickname; // 카카오 닉네임

    public SocialUserDto(Member member, String token) {
        this.member = member;
        this.token = token;
        this.provider = member.getProvider();
        this.name = member.getName();
        this.nickname = member.getNickname();
    }
}
