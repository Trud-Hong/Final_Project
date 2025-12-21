package com.farm.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestCorsController {

    @GetMapping
    public String testGet() {
        return "GET OK";
    }

    @PostMapping
    public String testPost() {
        return "POST OK";
    }

    @DeleteMapping
    public String testDelete() {
        return "DELETE OK";
    }
}
