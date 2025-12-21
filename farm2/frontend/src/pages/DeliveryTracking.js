import React, { useState } from "react";
import axios from "axios";

export default function DeliveryTracking() {
  const [carrier, setCarrier] = useState("kr.epost");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    setResult(null);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/delivery",
        {
          carrier: carrier,
          trackingNumber: trackingNumber,
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      setResult(res.data);
    } catch (err) {
      setError("조회 실패: 번호 또는 택배사를 확인하세요");
      console.error(err);
    }
  };

  return (
    <div style={{ width: "600px", margin: "60px auto" }}>
      <h2>배송 조회</h2>

      <select
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        style={{ width: "200px", marginRight: "10px" }}
      >
        <option value="kr.cjlogistics">CJ대한통운</option>
        <option value="kr.hanjin">한진택배</option>
        <option value="kr.logen">로젠택배</option>
        <option value="kr.epost">우체국택배</option>
      </select>

      <input
        placeholder="송장번호 입력"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        style={{ width: "250px", marginRight: "10px" }}
      />

      <button onClick={handleSearch}>조회</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h3>배송 상태</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
