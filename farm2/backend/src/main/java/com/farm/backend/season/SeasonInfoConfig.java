package com.farm.backend.season;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.farm.backend.product.entity.SeasonInfo;
import com.farm.backend.product.repository.SeasonInfoRepository;

@Configuration
public class SeasonInfoConfig {

        @Bean
        public CommandLineRunner initSeasonInfo(SeasonInfoRepository repository) {
                return args -> {

                        // 이미 DB에 데이터 있으면 초기화 안함
                        // if (repository.count() > 0)
                        // return;

                        repository.saveAll(Arrays.asList(

                                        // ---------------------------
                                        // 과일 (fruit)
                                        // ---------------------------
                                        new SeasonInfo(null, "딸기", "fruit", Arrays.asList(12, 1, 2)),
                                        new SeasonInfo(null, "사과", "fruit", Arrays.asList(9, 10, 11)),
                                        new SeasonInfo(null, "배", "fruit", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "포도", "fruit", Arrays.asList(8, 9, 10)),
                                        new SeasonInfo(null, "수박", "fruit", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "참외", "fruit", Arrays.asList(6, 7)),
                                        new SeasonInfo(null, "멜론", "fruit", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "복숭아", "fruit", Arrays.asList(7, 8)),
                                        new SeasonInfo(null, "자두", "fruit", Arrays.asList(6, 7)),
                                        new SeasonInfo(null, "귤", "fruit", Arrays.asList(11, 12, 1)),
                                        new SeasonInfo(null, "한라봉", "fruit", Arrays.asList(1, 2, 3)),
                                        new SeasonInfo(null, "감귤", "fruit", Arrays.asList(11, 12, 1)),
                                        new SeasonInfo(null, "레몬", "fruit", Arrays.asList(1, 2, 3)),
                                        new SeasonInfo(null, "오렌지", "fruit", Arrays.asList(12, 1, 2)),
                                        new SeasonInfo(null, "블루베리", "fruit", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "라즈베리", "fruit", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "키위", "fruit", Arrays.asList(11, 12, 1, 2)),
                                        new SeasonInfo(null, "체리", "fruit", Arrays.asList(6, 7)),
                                        new SeasonInfo(null, "망고", "fruit", Arrays.asList(4, 5, 6)),
                                        new SeasonInfo(null, "바나나", "fruit",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 8, 10, 11, 12)),
                                        new SeasonInfo(null, "감", "fruit", Arrays.asList(10, 11)),
                                        new SeasonInfo(null, "곶감", "fruit", Arrays.asList(12, 1)),
                                        new SeasonInfo(null, "석류", "fruit", Arrays.asList(10, 11)),

                                        // ---------------------------
                                        // 채소 (vegetable)
                                        // ---------------------------
                                        new SeasonInfo(null, "배추", "vegetable", Arrays.asList(11, 12, 1)),
                                        new SeasonInfo(null, "양배추", "vegetable", Arrays.asList(9, 10, 11)),
                                        new SeasonInfo(null, "상추", "vegetable", Arrays.asList(4, 5, 6)),
                                        new SeasonInfo(null, "깻잎", "vegetable", Arrays.asList(5, 6, 7, 8)),
                                        new SeasonInfo(null, "시금치", "vegetable", Arrays.asList(11, 12, 1)),
                                        new SeasonInfo(null, "부추", "vegetable", Arrays.asList(3, 4, 5)),
                                        new SeasonInfo(null, "청경채", "vegetable", Arrays.asList(4, 5, 6)),
                                        new SeasonInfo(null, "로메인", "vegetable", Arrays.asList(5, 6)),

                                        new SeasonInfo(null, "무", "vegetable", Arrays.asList(10, 11, 12)),
                                        new SeasonInfo(null, "당근", "vegetable", Arrays.asList(11, 12, 1, 2)),
                                        new SeasonInfo(null, "생강", "vegetable", Arrays.asList(10, 11)),

                                        new SeasonInfo(null, "오이", "vegetable", Arrays.asList(5, 6, 7)),
                                        new SeasonInfo(null, "토마토", "vegetable", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "애호박", "vegetable", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "가지", "vegetable", Arrays.asList(6, 7, 8)),
                                        new SeasonInfo(null, "피망", "vegetable", Arrays.asList(7, 8)),
                                        new SeasonInfo(null, "파프리카", "vegetable", Arrays.asList(8, 9)),
                                        new SeasonInfo(null, "고추(청양/풋)", "vegetable", Arrays.asList(7, 8)),

                                        new SeasonInfo(null, "대파", "vegetable", Arrays.asList(3, 4)),
                                        new SeasonInfo(null, "쪽파", "vegetable", Arrays.asList(3, 4)),
                                        new SeasonInfo(null, "양파", "vegetable", Arrays.asList(6, 7)),
                                        new SeasonInfo(null, "마늘", "vegetable", Arrays.asList(6)),

                                        new SeasonInfo(null, "감자", "vegetable", Arrays.asList(4, 5, 6)),
                                        new SeasonInfo(null, "고구마", "vegetable", Arrays.asList(9, 10, 11)),
                                        new SeasonInfo(null, "연근", "vegetable", Arrays.asList(10, 11, 12)),
                                        new SeasonInfo(null, "우엉", "vegetable", Arrays.asList(11, 12, 1)),
                                        new SeasonInfo(null, "콩나물", "vegetable",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),
                                        new SeasonInfo(null, "숙주나물", "vegetable",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),

                                        // ---------------------------
                                        // 곡물 (grain)
                                        // ---------------------------
                                        new SeasonInfo(null, "쌀", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "현미", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "보리", "grain", Arrays.asList(5, 6)),
                                        new SeasonInfo(null, "찹쌀", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "흑미", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "백미", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "옥수수", "grain", Arrays.asList(7, 8)),

                                        new SeasonInfo(null, "귀리", "grain", Arrays.asList(7, 8, 9)),
                                        new SeasonInfo(null, "수수", "grain", Arrays.asList(8, 9)),
                                        new SeasonInfo(null, "조", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "기장", "grain", Arrays.asList(9, 10)),

                                        new SeasonInfo(null, "콩", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "검은콩", "grain", Arrays.asList(10)),
                                        new SeasonInfo(null, "팥", "grain", Arrays.asList(11)),
                                        new SeasonInfo(null, "녹두", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "대두", "grain", Arrays.asList(10)),

                                        new SeasonInfo(null, "땅콩", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "아몬드", "grain",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),
                                        new SeasonInfo(null, "호두", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "캐슈넛", "grain",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),

                                        new SeasonInfo(null, "참깨", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "들깨", "grain", Arrays.asList(9, 10)),
                                        new SeasonInfo(null, "해바라기씨", "grain", Arrays.asList(9)),

                                        new SeasonInfo(null, "표고버섯", "grain", Arrays.asList(3, 4, 5)),
                                        new SeasonInfo(null, "느타리버섯", "grain",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),
                                        new SeasonInfo(null, "팽이버섯", "grain",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)),
                                        new SeasonInfo(null, "새송이버섯", "grain",
                                                        Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12))));
                };
                
        }

        

        

}
