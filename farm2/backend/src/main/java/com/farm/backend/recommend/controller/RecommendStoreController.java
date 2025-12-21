package com.farm.backend.recommend.controller;

import com.farm.backend.recommend.entity.RecommendStore;
import com.farm.backend.recommend.service.RecommendStoreService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stores/recommend")
public class RecommendStoreController {

    private final RecommendStoreService service;

    // 전체 목록 조회
    @GetMapping
    public List<RecommendStore> getAll() {
        return service.findAll();
    }

    // 추가
    @PostMapping
    public RecommendStore add(@RequestBody RecommendStore store) {
        return service.save(store);
    }

    // 수정
    @PutMapping("/{id}")
    public RecommendStore update(@PathVariable String id, @RequestBody RecommendStore store) {
        return service.update(id, store);
    }

    // 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    @PutMapping("/{id}/move-up")
    public void moveUp(@PathVariable String id) {
        service.moveUp(id);
    }

    @PutMapping("/{id}/move-down")
    public void moveDown(@PathVariable String id) {
        service.moveDown(id);
    }

}
