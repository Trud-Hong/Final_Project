import React from "react";
import PredictTest from "../components/PredictTest";
import "../styles/predict.css";

export default function Predict() {
  return (
    <div>
    {/* Page Header Start */}
    <div className="container-fluid page-header mb-5 wow fadeIn" data-wow-delay="0.1s">
        <div className="container">
            <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                AI가격 예측
            </h1>
            <nav aria-label="breadcrumb animated slideInDown">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                    <li className="breadcrumb-item text-dark active" aria-current="page">AI가격 예측</li>
                </ol>
            </nav>
        </div>
    </div>
    {/* Page Header End */}
    <div className="predict-page-container">
      
      <div className="predict-header">
        
        <h1>AI 기반 농산물 가격 예측</h1>
        <p>최근 도매시장 데이터를 기반으로 AI가 다음 가격을 예측합니다.</p>
      </div>

      <div className="predict-card">
        <PredictTest />
      </div>
    </div>
    </div>
  );
}
