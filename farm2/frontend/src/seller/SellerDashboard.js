// src/seller/SellerDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./sellerDashboard.css";

const SellerDashboard = ({ mySeller }) => {

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const token = localStorage.getItem("token");

  // Order와 Product의 sellerId는 Member의 userId를 사용
  const sellerId = mySeller?.userId || null;

  /** ===============================
   * 1) 상품 목록 불러오기
   * =============================== */
  useEffect(() => {
    if (!sellerId) return;

    axios
      .get(`http://localhost:8080/seller/products/list/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("상품 목록:", res.data);
        setProducts(res.data);
      })
      .catch((err) => console.error("상품 목록 호출 오류:", err));
  }, [sellerId, token]);
  

  /** ===============================
   * 2) 주문 목록 불러오기
   * =============================== */
  useEffect(() => {
    if (!sellerId) return;  // 조건은 useEffect 내부에서만

    axios
      .get(`http://localhost:8080/api/orders/seller/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("주문 목록:", res.data);
        setOrders(res.data);
      })
      .catch((err) => console.error("주문 목록 호출 오류:", err));
  }, [sellerId, token]);

 /** ===============================
 * 3) 계산 로직
 * =============================== */
const toKSTDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  // 한국시간(+9)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);

  return kst.toISOString().split("T")[0];
};

const today = toKSTDate(new Date());

const todayOrders = orders.filter((o) => toKSTDate(o.orderDate) === today);

const completedOrders = orders.filter((o) => o.status === "거래완료");
const completedToday = todayOrders.filter((o) => o.status === "거래완료");

// 전체 매출/오늘 매출은 거래 완료 주문만 반영
const totalSales = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
const todaySales = completedToday.reduce((sum, o) => sum + o.totalPrice, 0);

// 상태 계산
const payCompleted = orders.filter((o) => o.status === "결제완료").length;
const shippingReady = orders.filter((o) => o.status === "배송준비" || o.status === "배송준비중").length;
const shippingIng = orders.filter((o) => o.status === "배송중").length;
const shippingDone = orders.filter((o) => o.status === "배송완료").length;
const salesCompleted = completedOrders.length;

// 정산 요청
const requestWithdraw = async () => {
  if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
    alert("정산 금액을 올바르게 입력하세요.");
    return;
  }

  if (Number(withdrawAmount) > mySeller.balance) {
    alert("정산 가능 금액보다 많은 금액을 정산할 수 없습니다.");
    return;
  }

  // 대기중인 정산 요청 금액 합계 계산
  const pendingAmount = withdrawHistory
    .filter(r => r.status === "REQUESTED" || r.status === "PENDING")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // totalSales를 넘을 수 없음 (대기중인 금액 포함)
  if (mySeller.totalSales && (pendingAmount + Number(withdrawAmount)) > mySeller.totalSales) {
    const availableAmount = mySeller.totalSales - pendingAmount;
    alert(`정산 가능 금액이 부족합니다. (대기중인 정산: ${pendingAmount.toLocaleString()}원, 총 매출: ${mySeller.totalSales.toLocaleString()}원, 가능 금액: ${availableAmount > 0 ? availableAmount.toLocaleString() : 0}원)`);
    return;
  }

  if (!accountNumber || accountNumber.trim() === '') {
    alert("계좌번호를 입력해주세요.");
    return;
  }

  if (!bankName || bankName.trim() === '') {
    alert("은행명을 입력해주세요.");
    return;
  }

  if (Number(withdrawAmount) < 1000) {
    alert("최소 정산 금액은 1,000원입니다.");
    return;
  }

  if (!window.confirm(`${Number(withdrawAmount).toLocaleString()}원을 정산하시겠습니까?`)) {
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:8080/api/seller/withdraw",
      {
        amount: Number(withdrawAmount),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim()
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      alert("정산 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.");
      setShowModal(false);
      setWithdrawAmount("");
      setBankName("");
      setAccountNumber("");
      setCurrentPage(1); // 첫 페이지로 이동
      loadWithdrawHistory(); // 리스트 새로고침
    } else {
      alert(res.data.message || "정산 요청에 실패했습니다.");
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.response?.data || "정산 요청 중 오류가 발생했습니다.";
    alert(errorMessage);
  }
};

//정산내역
const loadWithdrawHistory = () => {
  axios
    .get("http://localhost:8080/api/seller/withdraw/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setWithdrawHistory(res.data))
    .catch(() => console.log("정산 내역 조회 오류"));
};

useEffect(() => {
  if (sellerId) loadWithdrawHistory();
}, [sellerId]);

// 판매자 정보에서 은행명과 계좌번호를 기본값으로 설정
useEffect(() => {
  if (mySeller?.bank) setBankName(mySeller.bank);
  if (mySeller?.accountNumber) setAccountNumber(mySeller.accountNumber);
}, [mySeller]);

// 정산액 한글 변환
const numberToKorean = (number) => {
  if (!number) return "";

  const unitWords = ["", "만", "억", "조", "경"];
  const splitUnit = 10000;
  const resultArray = [];
  let resultString = "";

  for (let i = 0; i < unitWords.length; i++) {
    let unit = number % splitUnit;
    if (unit) {
      resultArray.push(unit + unitWords[i]);
    }
    number = Math.floor(number / splitUnit);
  }

  resultString = resultArray.reverse().join(" ");
  return resultString;
};


// 환불/취소 요청
const refundOrCancel = orders.filter((o) =>
  ["환불요청", "취소요청"].includes(o.status)
).length;

const refundCompleted = orders.filter((o) => o.status === "환불완료").length;
const refundCompletedAmount = orders
  .filter((o) => o.status === "환불완료")
  .reduce((sum, o) => sum + o.totalPrice, 0);


  const lowStockProducts = products.filter((p) => p.stock < 5);


  if (!mySeller) {
    return <p style={{ padding: "20px" }}>판매자 정보를 불러오는 중입니다...</p>;
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>판매자 대시보드</h3>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <button
      style={{
        width: "100px",
        background: "#4b7bec",
        color: "white",
        padding: "8px",
        border: "none",
        cursor: "pointer",
        marginTop: "4px"
      }}
      onClick={() => {
        // 판매자 정보에서 은행명과 계좌번호를 기본값으로 설정
        if (mySeller?.bank) setBankName(mySeller.bank);
        if (mySeller?.accountNumber) setAccountNumber(mySeller.accountNumber);
        setShowModal(true);
      }}
    >
      정산하기
    </button>
  </div>
        

      </div>

      {/* 요약 통계 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          padding: "20px",
        }}
      >

        <div className="admin-stat-card">
  <p className="admin-stat-label">전체 매출</p>
  <p className="admin-stat-number text-blue">{totalSales.toLocaleString()}원</p>
  <p className="admin-stat-sub">오늘 매출: 
    <span className="text-red"> {todaySales.toLocaleString()}원</span>
  </p>
  
  <hr className="stat-divider" />
  
  <p className="admin-stat-label">정산 가능 금액</p>
  <p className="admin-stat-number text-green">{mySeller.balance?.toLocaleString() || 0}원</p>
  
  <p className="admin-stat-sub">
    총 정산 신청액: <span className="text-gray">{mySeller.totalWithdrawn?.toLocaleString() || 0}원</span>
  </p>
</div>

<div className="admin-stat-card">
  <p className="admin-stat-label">배송 상태</p>
  <p className="admin-stat-sub">결제 완료: {payCompleted}건</p>
  <p className="admin-stat-sub">배송 준비중: {shippingReady}건</p>
  <p className="admin-stat-sub">배송 중: {shippingIng}건</p>
  <p className="admin-stat-sub">배송 완료: {shippingDone}건</p>
  <p className="admin-stat-sub">거래 완료: {salesCompleted}건</p>
</div>

<div className="admin-stat-card">
  <p className="admin-stat-label">환불/취소 요청</p>
  <p className="admin-stat-number text-red">{refundOrCancel}건</p>

  <hr className="stat-divider" />

  <p className="admin-stat-label">환불 완료</p>
  <p className="admin-stat-sub">{refundCompleted}건</p>
  <p className="admin-stat-sub">
    환불 금액: <span className="text-red">{refundCompletedAmount.toLocaleString()}원</span>
  </p>
</div>


      </div>

      {/* 재고 부족 상품 */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        <h4 style={{ fontSize: "16px", marginBottom: "10px" }}>재고 부족 상품</h4>

        {lowStockProducts.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#777" }}>
            재고 부족 상품이 없습니다.
          </p>
        ) : (
          <table className="admin-table">
            <thead className="admin-thead">
              <tr>
                <th className="admin-th">상품명</th>
                <th className="admin-th">재고</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td className="admin-td">{p.name}</td>
                  <td
                    className="admin-td"
                    style={{ color: "#e74c3c", fontWeight: 600 }}
                  >
                    {p.stock}개
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* 정산 요청 내역 */}
<div style={{ padding: "20px" }}>
  <h4 style={{ fontSize: "16px", marginBottom: "10px" }}>정산 요청 내역</h4>

  {withdrawHistory.length === 0 ? (
    <p style={{ fontSize: "14px", color: "#777" }}>
      정산 요청 기록이 없습니다.
    </p>
  ) : (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted">
          <span>총 <strong className="text-primary">{withdrawHistory.length}</strong>건</span>
        </div>
      </div>
      
      <table className="admin-table">
        <thead className="admin-thead">
          <tr>
            <th>신청일시</th>
            <th>금액</th>
            <th>은행명</th>
            <th>계좌번호</th>
            <th>상태</th>
            <th>처리일시</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const totalPages = Math.ceil(withdrawHistory.length / itemsPerPage);
            const indexOfLast = currentPage * itemsPerPage;
            const indexOfFirst = indexOfLast - itemsPerPage;
            const currentWithdrawHistory = withdrawHistory.slice(indexOfFirst, indexOfLast);
            
            return currentWithdrawHistory.map((r) => {
              const getStatusLabel = (status) => {
                if (status === "REQUESTED" || status === "PENDING") {
                  return { label: "대기중", color: "#f39c12" };
                } else if (status === "APPROVED") {
                  return { label: "승인", color: "green" };
                } else if (status === "REJECTED") {
                  return { label: "거절", color: "red" };
                }
                return { label: status, color: "#555" };
              };
              const statusInfo = getStatusLabel(r.status);
              return (
                <tr key={r.id}>
                  <td>{new Date(r.requestedAt).toLocaleString()}</td>
                  <td>{Number(r.amount || 0).toLocaleString()}원</td>
                  <td>{r.bankName || '-'}</td>
                  <td>{r.accountNumber || '-'}</td>
                  <td
                    style={{
                      color: statusInfo.color,
                      fontWeight: "600",
                    }}
                  >
                    {statusInfo.label}
                  </td>
                  <td>{r.processedAt ? new Date(r.processedAt).toLocaleString() : '-'}</td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {(() => {
        const totalPages = Math.ceil(withdrawHistory.length / itemsPerPage);
        
        return totalPages > 1 && (
          <div className="paging-wrapper">
            {/* 첫 페이지 */}
            <button
              className="page-circle"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>

            {/* 이전 페이지 */}
            <button
              className="page-circle"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            {/* 현재 페이지/전체 페이지 */}
            <span className="page-info">
              {currentPage} / {totalPages}
            </span>

            {/* 다음 페이지 */}
            <button
              className="page-circle"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>

            {/* 마지막 페이지 */}
            <button
              className="page-circle"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        );
      })()}
    </>
  )}
</div>


      {showModal && (
  <div className="withdraw-modal-overlay">
    <div className="withdraw-modal">
      
      <h3 className="withdraw-title">정산 요청</h3>

      <p className="withdraw-balance-text">
        사용 가능 금액:{" "}
        <span className="withdraw-balance-amount">
          {mySeller?.balance?.toLocaleString()}원
        </span>
      </p>

      <div className="withdraw-form-group">
        <label className="withdraw-label">정산 요청 금액</label>
        {/* 한글 금액 표시 */}
        {withdrawAmount && (
          <p className="withdraw-korean-amount">
            {numberToKorean(withdrawAmount)}원
          </p>
        )}
        <div className="withdraw-input-wrap">
          <span className="withdraw-won">₩</span>
          <input
            type="text"
            placeholder="금액 입력 (1,000원 단위)"
            value={withdrawAmount ? Number(withdrawAmount).toLocaleString() : ""}
            onChange={(e) => {
              let value = e.target.value.replace(/[^0-9]/g, "");
              setWithdrawAmount(Number(value));
            }}
            onBlur={() => {
              let num = Number(withdrawAmount);
              if (num > mySeller?.balance) num = mySeller.balance;
              setWithdrawAmount(num);
            }}
            className="withdraw-input"
          />
          <button
            type="button"
            className="withdraw-mini-btn"
            onClick={() => setWithdrawAmount(mySeller?.balance)}
          >
            전부 정산
          </button>
        </div>
      </div>

      <div className="withdraw-form-group">
        <label className="withdraw-label">은행명</label>
        <div className="withdraw-input-wrap">
          <input
            type="text"
            placeholder="은행명 입력 (예: 국민은행)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="withdraw-input"
          />
        </div>
      </div>

      <div className="withdraw-form-group">
        <label className="withdraw-label">계좌번호</label>
        <div className="withdraw-input-wrap">
          <input
            type="text"
            placeholder="계좌번호 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="withdraw-input"
          />
        </div>
      </div>

      <div className="withdraw-btn-group">
        <button className="withdraw-btn cancel" onClick={() => {
          setShowModal(false);
          setWithdrawAmount("");
          setBankName("");
          setAccountNumber("");
        }}>
          취소
        </button>

        <button className="withdraw-btn submit" onClick={requestWithdraw}>
          신청하기
        </button>
      </div>
      
    </div>
  </div>
)}


    </div>
    
  );
};

export default SellerDashboard;
