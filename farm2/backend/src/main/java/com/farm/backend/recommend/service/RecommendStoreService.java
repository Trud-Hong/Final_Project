package com.farm.backend.recommend.service;

import com.farm.backend.recommend.entity.RecommendStore;
import com.farm.backend.recommend.repository.RecommendStoreRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendStoreService {

    private final RecommendStoreRepository repository;

    public List<RecommendStore> findAll() {
        return repository.findAll()
                .stream()
                .sorted(Comparator.comparingInt(RecommendStore::getSortOrder))
                .collect(Collectors.toList());

    }

    public RecommendStore save(RecommendStore store) {
        int maxOrder = repository.findAll().stream()
                .mapToInt(RecommendStore::getSortOrder)
                .max()
                .orElse(0);

        store.setSortOrder(maxOrder + 1);
        return repository.save(store);
    }

    public RecommendStore update(String id, RecommendStore newData) {

        return repository.findById(id)
                .map(old -> {

                    old.setSellerId(newData.getSellerId());
                    old.setPhone(newData.getPhone());
                    old.setSellerName(newData.getSellerName());
                    old.setFarmName(newData.getFarmName());
                    old.setCategory(newData.getCategory());
                    old.setLocation(newData.getLocation());
                    old.setAddress(newData.getAddress());
                    old.setIntro(newData.getIntro());
                    old.setImageUrl(newData.getImageUrl());
                    old.setStartDate(newData.getStartDate());

                    return repository.save(old);
                })
                .orElseThrow(() -> new RuntimeException("추천가게를 찾을 수 없습니다: " + id));
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    public void moveUp(String id) {
        List<RecommendStore> stores = findAll();
        for (int i = 0; i < stores.size(); i++) {
            if (stores.get(i).getId().equals(id) && i > 0) {
                RecommendStore current = stores.get(i);
                RecommendStore prev = stores.get(i - 1);

                int tmp = current.getSortOrder();
                current.setSortOrder(prev.getSortOrder());
                prev.setSortOrder(tmp);

                repository.save(prev);
                repository.save(current);
                break;
            }
        }
    }

    public void moveDown(String id) {
        List<RecommendStore> stores = findAll();
        for (int i = 0; i < stores.size(); i++) {
            if (stores.get(i).getId().equals(id) && i < stores.size() - 1) {
                RecommendStore current = stores.get(i);
                RecommendStore next = stores.get(i + 1);

                int tmp = current.getSortOrder();
                current.setSortOrder(next.getSortOrder());
                next.setSortOrder(tmp);

                repository.save(next);
                repository.save(current);
                break;
            }
        }
    }

}
