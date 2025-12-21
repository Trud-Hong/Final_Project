package com.farm.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiResponseDto {

    private String answer;
    private boolean needAgent;

    public AiResponseDto(String answer, boolean needAgent) {
        this.answer = answer;
        this.needAgent = needAgent;
    }
}
