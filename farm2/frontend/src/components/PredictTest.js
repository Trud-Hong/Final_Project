import React, { useState, useEffect } from "react";

import axios from "axios";
import { Line } from "react-chartjs-2";
import "../css/predict.css";  


export default function PredictTest() {
  const [mainCategory, setMainCategory] = useState("");  // 과일/채소/곡물
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [predict, setPredict] = useState(null);
  const [chartData, setChartData] = useState(null);

  const month = new Date().getMonth() + 1;


  /** ------------------------------
   *  📌 SellerProductForm과 동일한 카테고리 구성
   * ------------------------------ */
  const categoryOptions = {
    fruit: [
      "딸기", "사과", "배", "포도", "수박", "참외", "멜론", "복숭아",
      "자두", "감", "귤", "한라봉", "레몬", "오렌지", "블루베리",
      "라즈베리", "키위", "체리", "망고", "바나나"
    ],

    vegetable: [
      "배추", "양배추", "상추", "깻잎", "시금치", "부추", "청경채",
      "오이", "토마토", "애호박", "가지", "피망", "파프리카",
      "고추(청양/풋)", "대파", "쪽파", "양파", "마늘",
      "무", "당근", "감자", "고구마"
    ],

    grain: [
      "쌀", "현미", "보리", "옥수수",
      "표고버섯", "느타리버섯", "팽이버섯", "새송이버섯"
    ]
  };

  /** 🔥 대분류 변경 시 소분류 초기화 */
  const handleMainCategory = (e) => {
    setMainCategory(e.target.value);
    setProduct(""); // 소분류 초기화
  };

  /** 🔥 예측 실행 */
  const handlePredict = () => {
    if (!product) {
      alert("품목을 선택해주세요.");
      return;
    }

    setLoading(true);

    axios
      .get("http://localhost:8080/api/ai-price/predict-fast", {
        params: { product },
      })
      .then((res) => {
        const { history, predict } = res.data;
        setPredict(predict);

        // 그래프용 라벨 구성
        const labels =
          history.map((v, idx) => `${history.length - idx}일전`)
            .concat("예측");

        setChartData({
          labels,
          datasets: [
            {
              label: `${product} 가격`,
              data: [...history, predict],
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.2)",
              tension: 0.3,
              pointRadius: 5,
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  };

  const findCategoryOf = (itemName) => {
    for (const category in categoryOptions) {
      if (categoryOptions[category].includes(itemName)) {
        return category;
      }
    }
    return null;
  };


  return (
    
    <div className="predict-box">

        <p className="warn-text">
          ⚠ 제철이 아닌 품목은 최근 거래가 없어 예측 결과가 없거나 0원이 나올 수 있습니다.
        </p>

      {/* 🔥 카테고리 선택 UI */}
<div className="predict-input-area">
  
  <select
    value={mainCategory}
    onChange={handleMainCategory}
  >
    <option value="">카테고리 선택</option>
    <option value="fruit">과일</option>
    <option value="vegetable">채소</option>
    <option value="grain">곡물 & 버섯</option>
  </select>

  <select
    value={product}
    disabled={!mainCategory}
    onChange={(e) => setProduct(e.target.value)}
  >
    <option value="">품목 선택</option>
    {mainCategory &&
      categoryOptions[mainCategory].map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
  </select>

  <button onClick={handlePredict}>가격 예측하기</button>

</div>



      {/* 🔥 결과 출력 */}

      {loading && <p>AI가 분석중입니다...</p>}

      {predict && (
        <p className="predict-result">
          예상 가격: <b>{Math.round(predict).toLocaleString()}</b> 원
        </p>
      )}

      {chartData && (
        <div className="predict-chart">
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}
