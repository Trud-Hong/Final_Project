package com.farm.backend.repository;

import com.farm.backend.domain.Member;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends MongoRepository<Member, String> {

    boolean existsByEmail(String email);
    boolean existsByUserId(String userId);

    Optional<Member> findByUserId(String userId);
    Member findByEmail(String email);
    Member findByNickname(String nickname);
    Member findByNameAndPhone(String name, String phone);
    List<Member> findByPhone(String phone);
    // 아이디 찾기 (이름 + 이메일)
    Member findByNameAndEmail(String name, String email);

    Member findByUserIdAndEmail(String userId, String email);
    // 비밀번호 찾기 (이름 + 아이디 + 이메일)
    Member findByNameAndUserIdAndEmail(String name, String userId, String email);
    
    void deleteByUserId(String userId);

    boolean existsByPhone(String phone);
    boolean existsByNickname(String nickname);

}
