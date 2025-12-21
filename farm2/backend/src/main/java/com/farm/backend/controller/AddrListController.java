package com.farm.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.farm.backend.domain.AddrList;
import com.farm.backend.repository.AddListRepository;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@SuppressWarnings("null")

@RestController // json으로 주고 받는 api컨트롤러
@CrossOrigin(origins = "http://localhost:3000")

@RequestMapping("/api/addr")
public class AddrListController {

    @Autowired // 배송지 인터페이스
    private AddListRepository addrListRepository;

    // 전체조회
    @GetMapping
    public List<AddrList> getAddrList(@RequestParam String userId) {
        return addrListRepository.findByUserId(userId);
    }

    // 배송지 추가
    @PostMapping("/save")
    public AddrList saveAddrList(@RequestBody AddrList addrList) {

        // DB저장해
        AddrList saveAddrList = addrListRepository.save(addrList);
        System.out.println("배송지 저장 완료: " + saveAddrList);

        return saveAddrList;
    }

    // 배송지 수정
    @PutMapping("/update/{id}")
    public AddrList updateAddrList(@PathVariable String id, @RequestBody AddrList addrList) {
        // id만 유지, 내용만 수정
        addrList.setId(id);

        // 저장해
        AddrList updateAddrList = addrListRepository.save(addrList);
        System.out.println("배송지 수정 완료: " + updateAddrList);

        return updateAddrList;
    }

    // 배송지 삭제
    @DeleteMapping("/delete/{id}")
    public String deleteAddrList(@PathVariable String id) {

        // DB에서 삭제해
        addrListRepository.deleteById(id);
        System.out.println("배송지 삭제 완료");
        return "삭제 완료";
    }

    // 기본 배송지 설정
    @PutMapping("/set-default/{id}")
    public ResponseEntity<?> setDefaultAddr(@PathVariable String id, @RequestParam String userId) {
        try {
            System.out.println("기본 배송지 설정 시작 - id: " + id + ", userId: " + userId);

            // 먼저 선택한 배송지를 조회
            AddrList defaultAddr = addrListRepository.findById(id).orElse(null);
            if (defaultAddr == null) {
                System.out.println("배송지를 찾을 수 없습니다. id: " + id);
                Map<String, String> error = new HashMap<>();
                error.put("error", "배송지를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            // 해당 사용자의 배송지인지 확인
            if (!defaultAddr.getUserId().equals(userId)) {
                System.out.println("권한이 없습니다. userId: " + userId + ", 배송지 userId: " + defaultAddr.getUserId());
                Map<String, String> error = new HashMap<>();
                error.put("error", "권한이 없습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // 해당 사용자의 모든 배송지의 기본 배송지 플래그를 false로 설정
            List<AddrList> userAddrList = addrListRepository.findByUserId(userId);
            System.out.println("사용자의 배송지 개수: " + userAddrList.size());
            for (AddrList addr : userAddrList) {
                if (addr.isDefault()) {
                    System.out.println("기존 기본 배송지 해제: " + addr.getId() + ", " + addr.getTitle());
                    addr.setDefault(false);
                    addrListRepository.save(addr);
                }
            }

            // 선택한 배송지를 기본 배송지로 설정
            System.out.println("새 기본 배송지 설정 전: " + defaultAddr.getTitle() + ", isDefault: " + defaultAddr.isDefault());
            defaultAddr.setDefault(true);
            AddrList savedAddr = addrListRepository.save(defaultAddr);
            System.out.println("기본 배송지 설정 완료: " + savedAddr.getTitle() + ", isDefault: " + savedAddr.isDefault());

            return ResponseEntity.ok(savedAddr);
        } catch (Exception e) {
            System.out.println("기본 배송지 설정 중 예상치 못한 오류: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "기본 배송지 설정 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /* 여기는 테스트구역 */
    @PostMapping("/test")
    public AddrList createTestAddrList(@RequestBody AddrList addrList) {

        return addrListRepository.save(addrList);
    }

    @GetMapping("/test2")
    public String createBulkTestData() {

        AddrList addrList1 = new AddrList("hj", "우리집", "서울시 강남수 테헤란로 123", "06234", "101동", "010-1111-1111");

        addrListRepository.save(addrList1);

        return "저장완료";
    }
    /* 여기까지 테스트 구역 */

}
