package com.farm.backend.controller;

import com.farm.backend.dto.AiRequestDto;
import com.farm.backend.dto.AiResponseDto;
import com.farm.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public AiResponseDto chat(@RequestBody AiRequestDto req) throws Exception {
        return aiService.sendMessage(req);
    }
}
