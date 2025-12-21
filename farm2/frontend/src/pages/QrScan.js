import React, { useEffect, useState } from "react";
import axios from "axios";

const QrScan = () => {
  const [result, setResult] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  const step = params.get("step");

  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/orders/scan?orderId=${orderId}&step=${step}&key=DELIVERY_QR_SECRET`)
      .then(res => setResult(res.data))
      .catch(err => setResult({ success: false, message: "처리 중 오류 발생" }));
  }, [orderId, step]);

  if (!result) return <h2>QR 처리 중...</h2>;

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h2>배송 상태 자동 업데이트</h2>
      <p>주문번호: {orderId}</p>
      <p>변경된 상태: {result.status}</p>

      <h3 style={{ marginTop: "20px", color: "green" }}>{result.message}</h3>
    </div>
  );
};

export default QrScan;
