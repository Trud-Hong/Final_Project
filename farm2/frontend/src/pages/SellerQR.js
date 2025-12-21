import React from "react";
import { useParams } from "react-router-dom";
import "./SellerQR.css";

const SellerQR = () => {
  const { orderId } = useParams();

  return (
    <div className="qr-container">
      <h2 className="qr-title">배송 QR 코드</h2>
      <p className="qr-order-id">주문번호: {orderId}</p>

      <div className="qr-list-wrapper">

        {/* PACKED */}
        <div className="qr-card">
          <h3 className="qr-label">📦 배송 준비 (PACKED)</h3>
          <img
            className="qr-image"
            src={`http://localhost:8080/qr/${orderId}_PACKED.png`}
            alt="PACKED QR"
          />
        </div>

        {/* PICKED UP */}
        <div className="qr-card">
          <h3 className="qr-label">🚚 배송 중 (PICKED_UP)</h3>
          <img
            className="qr-image"
            src={`http://localhost:8080/qr/${orderId}_PICKED_UP.png`}
            alt="PICKED_UP QR"
          />
        </div>

        {/* DELIVERED */}
        <div className="qr-card">
          <h3 className="qr-label">📬 배송 완료 (DELIVERED)</h3>
          <img
            className="qr-image"
            src={`http://localhost:8080/qr/${orderId}_DELIVERED.png`}
            alt="DELIVERED QR"
          />
        </div>
      </div>
    </div>
  );
};

export default SellerQR;
