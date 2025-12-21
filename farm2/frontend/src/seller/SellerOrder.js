import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import "./SellerOrder.css";
import Pagination from '../components/Pagination';
import { useLocation, useNavigate } from 'react-router-dom';

const SellerOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [openOrderId, setOpenOrderId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPage = parseInt(searchParams.get("page") || "0", 10);

  const [page, setPage] = useState(initialPage);
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [itemsPerPage] = useState(10); // 페이지당 주문 수


  const sellerId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  /** ===============================
   * 주문 목록 불러오기
   * =============================== */
  useEffect(() => {
    if (!sellerId) return;

    axios
      .get(`http://localhost:8080/api/orders/seller/${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => console.error("주문 목록 호출 오류:", err));
  }, [sellerId, token]);

  // page가 변경될 때 currentPage 동기화 (0-based -> 1-based)
  useEffect(() => {
    setCurrentPage(page + 1);
  }, [page]);

  // URL 파라미터 변경 시 page 동기화
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPage = parseInt(params.get("page") || "0", 10);
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [location.search, page]);

  const refreshOrders = () => {
  axios
    .get(`http://localhost:8080/api/orders/seller/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setOrders(res.data))
    .catch((err) => console.error("주문 새로고침 오류:", err));
};

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);

    setPage(newPage);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };


  /** ===============================
   * 필터 적용
   * =============================== */
  const filteredOrders = useMemo(() => {
    if (filterStatus === "ALL") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [filterStatus, orders]);

  /** ===============================
   * 상태 표시 한글 변환
   * =============================== */
  const getStatusText = (status) => {
    switch (status) {
      case "결제완료":
        return "결제 완료";
      case "배송준비":
        return "배송 준비중";
      case "배송중":
        return "배송 중";
      case "배송완료":
        return "배송 완료";
      case "거래완료":
        return "거래 완료";
      case "환불요청":
        return "환불 요청";
      case "취소요청":
        return "취소 요청";
      default:
        return status;
    }
  };
// 페이지네이션 적용
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const getNextStatus = (status) => {
  switch (status) {
    case "결제완료":
      return "배송준비";
    case "배송준비":
      return "배송중";
    case "배송중":
      return "배송완료";
    default:
      return null;
  }
};


  /** ===============================
   * 상태 변경 API
   * =============================== */
  const updateStatus = async (orderId, nextStatus) => {
    try {
      await axios.put(
        `http://localhost:8080/api/orders/${orderId}/status`,
        null,
        {
          params: { status: nextStatus },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: nextStatus } : o
        )
      );

      alert("주문 상태가 변경되었습니다.");
    } catch (err) {
      console.error("상태 변경 오류:", err);
    }
  };

  /** ===============================
   * 아코디언 토글
   * =============================== */
  const toggleOrder = (orderId) => {
    setOpenOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const getStatusStep = (status) => {
    const steps = [
      { key: "결제완료", label: "결제 완료" },
      { key: "배송준비", label: "배송 준비중" },
      { key: "배송중", label: "배송 중" },
      { key: "배송완료", label: "배송 완료" },
    ];

    let activeIndex = steps.findIndex((s) => s.key === status);
    if (status === "거래완료") {
      activeIndex = steps.length - 1;
    }

    return steps.map((s, idx) => ({
      ...s,
      active: activeIndex === -1 ? false : idx <= activeIndex,
    }));
  };

  const approveRefund = async (orderId) => {
  try {
    await axios.put(`http://localhost:8080/api/orders/refund/${orderId}`);
    alert("환불 처리가 완료되었습니다.");
    refreshOrders();

    // 상태 갱신
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "환불완료" } : o
      )
    );
  } catch (err) {
    console.error("환불 승인 오류", err);
    alert("환불 처리 실패");
  }
};

// 주문취소 승인
const approveCancel = async (orderId) => {
  if (!window.confirm("취소 요청을 승인하시겠습니까?")) return;

  try {
    
    const res = await fetch(`http://localhost:8080/api/orders/cancel-approve/${orderId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (res.ok) {
      alert("주문 취소가 승인되었습니다.");
      refreshOrders(); // 새로고침 함수
    } else {
      alert("취소 승인 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류");
  }
};


// 주문취소 거절
const rejectCancel = async (order) => {
  const reason = window.prompt("취소 거절 사유를 입력하세요:");

  if (!reason || reason.trim() === "") {
    alert("사유를 입력해야 합니다.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/orders/cancel-reject/${order.id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rejectReason: reason }),
    });

    if (res.ok) {
      alert("취소 요청이 거절되었습니다.");
      refreshOrders(); // 새로고침
    } else {
      alert("취소 거절 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류");
  }
};


// 환불 거절 요청
const rejectRefund = async (orderId) => {
  const reason = window.prompt("환불 거절 사유를 입력해주세요:");

  if (!reason || reason.trim() === "") {
    alert("거절 사유를 입력해야 합니다.");
    return;
  }

  try {
    await axios.put(
      `http://localhost:8080/api/orders/refund-reject/${orderId}`,
      { rejectReason: reason }, // 판매자가 입력한 사유 전달
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("환불 거절 처리되었습니다.");

    // 프론트 상태 반영
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "환불거절", refundRejectReason: reason }
          : o
      )
    );
  } catch (error) {
    console.error(error);
    alert("환불 거절 처리 중 오류 발생");
  }
};




  /** ===============================
   * 날짜 포맷
   * =============================== */
  const formatOrderDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  };

  return (
    <div className="admin-card">
      <div
        className="admin-card-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <h3 style={{ margin: 0 }}>주문 관리</h3>

        <select
          className="admin-input"
          style={{ width: "180px" }}
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);   // 페이지 초기화 (0-based)
          }}
          
        >
          <option value="ALL">전체 주문</option>
          <option value="결제완료">결제완료</option>
          <option value="배송준비">배송 준비중</option>
          <option value="배송중">배송 중</option>
          <option value="배송완료">배송 완료</option>
          <option value="환불요청">환불 요청</option>
          <option value="취소요청">취소 요청</option>
          <option value="거래완료">거래 완료</option>
        </select>
      </div>

      <table className="admin-table">
        <thead className="admin-thead">
          <tr>
            <th className="admin-th">주문번호</th>
            <th className="admin-th">상품명</th>
            <th className="admin-th">수량</th>
            <th className="admin-th">구매자</th>
            <th className="admin-th">총금액</th>
            
            <th className="admin-th">주문일</th>
            <th className="admin-th">상태</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                주문이 없습니다.
              </td>
            </tr>
          ) : (
            currentOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr
  className={
    ["거래완료", "취소완료", "환불완료", "환불거절"].includes(order.status)
      ? "order-row-completed"
      : ""
  }
>

                  <td className="admin-td" style={{ padding: "8px" }}>
  <span
    title={order.id}  // 마우스 올리면 전체 ID 뜸
    style={{
      display: "inline-block",
      maxWidth: "140px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontWeight: "600",
    }}
  >
    {order.id}
  </span>
</td>

                  <td className="admin-td">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div>
                        {(() => {
                          // 단위 옵션을 선택하지 않은 경우 상품명에서 단위 제거
                          const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
                          const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
                          
                          // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
                          const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
                          const hasUnit = unitValue !== '' && !isStandaloneUnit;
                          
                          if (!hasUnitProductName && !hasUnit) {
                            let pname = order.pname || '';
                            // 상품명 끝에 있는 단독 단위 패턴 제거
                            // 숫자 뒤에 오는 단위(예: "500g", "1kg")는 제품명의 일부이므로 유지
                            // 공백 뒤에 단독으로 오는 단위만 제거 (예: " kg", " 개")
                            // 정규식: 공백 + 단위 패턴으로 끝나는 경우, 그 앞이 숫자가 아니면 제거
                            const unitPattern = /([kg개봉포박스팩병입]+)$/i;
                            const spaceUnitPattern = /\s+([kg개봉포박스팩병입]+)$/i;
                            
                            // 끝에 공백+단위 패턴이 있는지 확인
                            const spaceUnitMatch = pname.match(spaceUnitPattern);
                            if (spaceUnitMatch) {
                              const beforeSpaceUnit = pname.substring(0, pname.length - spaceUnitMatch[0].length);
                              // 공백+단위 앞의 문자가 숫자로 끝나지 않으면 제거
                              if (!beforeSpaceUnit.match(/\d$/)) {
                                pname = beforeSpaceUnit.trim();
                              }
                            } else {
                              // 공백 없이 단위만 있는 경우 (예: "사과kg"), 숫자 뒤가 아니면 제거
                              const unitMatch = pname.match(unitPattern);
                              if (unitMatch) {
                                const beforeUnit = pname.substring(0, pname.length - unitMatch[0].length);
                                // 단위 앞의 문자가 숫자로 끝나지 않으면 제거
                                if (!beforeUnit.match(/\d$/)) {
                                  pname = beforeUnit.trim();
                                }
                              }
                            }
                            return pname;
                          }
                          return order.pname;
                        })()}
                      </div>
                      {/* 단위 옵션 정보 표시 (단위 옵션이 실제로 선택된 경우에만) */}
                      {(() => {
                        const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
                        const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
                        
                        // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
                        const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
                        const hasUnit = unitValue !== '' && !isStandaloneUnit;
                        
                        return (hasUnitProductName || hasUnit) ? (
                          <span style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                            {hasUnitProductName ? `${order.selectedUnitProductName.trim()} - ` : ''}
                            {hasUnit ? unitValue : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="admin-td">{order.qty}</td>
                  <td className="admin-td">{order.userId}</td>
                  <td className="admin-td">{order.totalPrice.toLocaleString()}원</td>
                  <td className="admin-td">{formatOrderDate(order.orderDate)}</td>

                  <td className="admin-td" style={{ padding: "8px" }}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      whiteSpace: "nowrap",       // 줄바꿈 방지
      gap: "12px",
    }}
  >
    {/* 상태 (왼쪽 정렬, 길어져도 줄바꿈 X) */}
    <span className={`status-badge ${
  order.refundRejected
    ? "status-cancel" 
    : order.status === "거래완료"
    ? "status-completed"
    : order.status === "배송완료"
    ? "status-delivered"
    : order.status === "배송중"
    ? "status-shipping"
    : order.status === "배송준비"
    ? "status-ready"
    : order.status === "환불요청" || order.status === "취소요청"
    ? "status-cancelreq"
    : order.status === "환불완료" || order.status === "취소완료"
    ? "status-cancel"
    : "status-pending"
}`}>
  {order.refundRejected ? "환불거절" : getStatusText(order.status)}
</span>




    {/* 상세보기 버튼 (오른쪽 끝 고정) */}
    <button
      className="btn btn-primary"
      onClick={() => toggleOrder(order.id)}
      style={{
        padding: "4px 12px",
        fontSize: "12px",
        flexShrink: 0, // 버튼 크기 고정하여 밀리지 않게
      }}
    >
      {openOrderId === order.id ? "닫기" : "상세보기"}
    </button>
  </div>
</td>


                </tr>

                {openOrderId === order.id && (
  <tr>
    <td colSpan="8" style={{ background: "#fafafa", padding: 0 }}>
      <div style={{ padding: "20px 20px 20px 0px", borderTop: "1px solid #ddd" }}>
        <h5 style={{ marginBottom: "15px" }}>주문 상세 정보</h5>

        <div style={{ display: "flex", justifyContent: "space-between" }}>

         <div
  style={{
    flex: 1,
    background: "#fff",
    padding: "10px 10px 10px 0px",
    margin: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  }}
>
  <div style={{ display: "flex", gap: "20px" }}>
    
    {/* 왼쪽: 이미지 + 요약 */}
    <div style={{ width: "260px", textAlign: "center" }}>

      {/* 상품 이미지 */}
      <img
        src={order.productImage}
        alt={order.pname}
        style={{
          width: "240px",
          height: "240px",
          objectFit: "cover",
          borderRadius: "14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          marginBottom: "15px"
        }}
      />

      {/* 이미지 아래 요약정보 */}
      <div>
        <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "6px" }}>
          {(() => {
            // 단위 옵션을 선택하지 않은 경우 상품명에서 단위 제거
            const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
            const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
            
            // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
            const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
            const hasUnit = unitValue !== '' && !isStandaloneUnit;
            
            if (!hasUnitProductName && !hasUnit) {
              let pname = order.pname || '';
              // 상품명 끝에 있는 단독 단위 패턴 제거
              // 숫자 뒤에 오는 단위(예: "500g", "1kg")는 제품명의 일부이므로 유지
              // 공백 뒤에 단독으로 오는 단위만 제거 (예: " kg", " 개")
              const unitPattern = /([kg개봉포박스팩병입]+)$/i;
              const spaceUnitPattern = /\s+([kg개봉포박스팩병입]+)$/i;
              
              // 끝에 공백+단위 패턴이 있는지 확인
              const spaceUnitMatch = pname.match(spaceUnitPattern);
              if (spaceUnitMatch) {
                const beforeSpaceUnit = pname.substring(0, pname.length - spaceUnitMatch[0].length);
                // 공백+단위 앞의 문자가 숫자로 끝나지 않으면 제거
                if (!beforeSpaceUnit.match(/\d$/)) {
                  pname = beforeSpaceUnit.trim();
                }
              } else {
                // 공백 없이 단위만 있는 경우 (예: "사과kg"), 숫자 뒤가 아니면 제거
                const unitMatch = pname.match(unitPattern);
                if (unitMatch) {
                  const beforeUnit = pname.substring(0, pname.length - unitMatch[0].length);
                  // 단위 앞의 문자가 숫자로 끝나지 않으면 제거
                  if (!beforeUnit.match(/\d$/)) {
                    pname = beforeUnit.trim();
                  }
                }
              }
              return pname;
            }
            return order.pname;
          })()}
        </div>
        {/* 단위 옵션 정보 표시 (단위 옵션이 실제로 선택된 경우에만) */}
        {(() => {
          const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
          const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
          
          // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
          const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
          const hasUnit = unitValue !== '' && !isStandaloneUnit;
          
          return (hasUnitProductName || hasUnit) ? (
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
              {hasUnitProductName ? `${order.selectedUnitProductName.trim()} - ` : ''}
              {hasUnit ? unitValue : ''}
            </div>
          ) : null;
        })()}
        <div style={{ color: "#555", fontSize: "15px", marginBottom: "4px" }}>
          {order.price?.toLocaleString()}원 / {order.qty}개
        </div>

        <div style={{ color: "#333", fontSize: "15px", fontWeight: "500" }}>
          총 금액: {order.totalPrice.toLocaleString()}원
        </div>
      </div>
    </div>

    {/* 오른쪽: 표 */}
    <div style={{ flex: 1 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "15px",
          color: "#333",
          minWidth: "350px"
        }}
      >
        <tbody>
          {[
            ["주문번호", order.id],
            ["구매자", order.userId],
            ["상품명", (
              <div>
                <div>
                  {(() => {
                    // 단위 옵션을 선택하지 않은 경우 상품명에서 단위 제거
                    const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
                    const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
                    
                    // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
                    const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
                    const hasUnit = unitValue !== '' && !isStandaloneUnit;
                    
                    if (!hasUnitProductName && !hasUnit) {
                      let pname = order.pname || '';
                      // 상품명 끝에 있는 단독 단위 패턴 제거
                      // 숫자 뒤에 오는 단위(예: "500g", "1kg")는 제품명의 일부이므로 유지
                      // 공백 뒤에 단독으로 오는 단위만 제거 (예: " kg", " 개")
                      const unitPattern = /([kg개봉포박스팩병입]+)$/i;
                      const spaceUnitPattern = /\s+([kg개봉포박스팩병입]+)$/i;
                      
                      // 끝에 공백+단위 패턴이 있는지 확인
                      const spaceUnitMatch = pname.match(spaceUnitPattern);
                      if (spaceUnitMatch) {
                        const beforeSpaceUnit = pname.substring(0, pname.length - spaceUnitMatch[0].length);
                        // 공백+단위 앞의 문자가 숫자로 끝나지 않으면 제거
                        if (!beforeSpaceUnit.match(/\d$/)) {
                          pname = beforeSpaceUnit.trim();
                        }
                      } else {
                        // 공백 없이 단위만 있는 경우 (예: "사과kg"), 숫자 뒤가 아니면 제거
                        const unitMatch = pname.match(unitPattern);
                        if (unitMatch) {
                          const beforeUnit = pname.substring(0, pname.length - unitMatch[0].length);
                          // 단위 앞의 문자가 숫자로 끝나지 않으면 제거
                          if (!beforeUnit.match(/\d$/)) {
                            pname = beforeUnit.trim();
                          }
                        }
                      }
                      return pname;
                    }
                    return order.pname;
                  })()}
                </div>
                {/* 단위 옵션 정보 표시 (단위 옵션이 실제로 선택된 경우에만) */}
                {(() => {
                  const hasUnitProductName = order.selectedUnitProductName && typeof order.selectedUnitProductName === 'string' && order.selectedUnitProductName.trim() !== '';
                  const unitValue = order.selectedUnit && typeof order.selectedUnit === 'string' ? order.selectedUnit.trim() : '';
                  
                  // selectedUnitProductName이 없고, selectedUnit이 숫자가 포함되지 않은 단독 단위(예: "kg", "g", "개")인 경우는 단위 옵션이 아님
                  const isStandaloneUnit = !hasUnitProductName && unitValue && /^(kg|g|개|봉|포|박스|팩|병|입)$/i.test(unitValue);
                  const hasUnit = unitValue !== '' && !isStandaloneUnit;
                  
                  return (hasUnitProductName || hasUnit) ? (
                    <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                      {hasUnitProductName ? `${order.selectedUnitProductName.trim()} - ` : ''}
                      {hasUnit ? unitValue : ''}
                    </div>
                  ) : null;
                })()}
              </div>
            )],
            ["단가", `${order.price?.toLocaleString()}원`],
            ["수량", `${order.qty}개`],
            ["총 금액", `${order.totalPrice.toLocaleString()}원`],
            ["주문일", formatOrderDate(order.orderDate)],
          ].map(([label, value], idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #ccc" }}>
              <td
                style={{
                  padding: "12px 16px",
                  fontWeight: "600",
                  background: "#f0f0f0ff",
                  width: "120px",
                  borderRight: "1px solid #ccc",
                }}
              >
                {label}
              </td>
              <td style={{ padding: "12px 16px" }}>{value}</td>
            </tr>
          ))}
          {/* 배송지 정보 별도 처리 - 여러 줄로 표시 */}
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <td
              style={{
                padding: "12px 16px",
                fontWeight: "600",
                background: "#f0f0f0ff",
                width: "120px",
                borderRight: "1px solid #ccc",
                verticalAlign: "top",
              }}
            >
              배송지
            </td>
            <td style={{ padding: "12px 16px" }}>
              {order.deliveryTitle && (
                <>
                  <strong>{order.deliveryTitle}</strong>
                  <br />
                </>
              )}
              {order.deliveryPost || order.deliveryAddr1 || order.deliveryAddr2 || order.deliveryPhone ? (
                <>
                  {order.deliveryAddr1 && order.deliveryPost && (
                    <>
                      ({order.deliveryPost}){order.deliveryAddr1}
                      <br />
                    </>
                  )}
                  {order.deliveryAddr2 && (
                    <>
                      {order.deliveryAddr2}
                      <br />
                    </>
                  )}
                  {order.deliveryPhone && `연락처: ${order.deliveryPhone}`}
                </>
              ) : (
                '배송지 정보 없음'
              )}
            </td>
          </tr>
          
        </tbody>
      </table>
    </div>

  </div>
</div>




          {/* 오른쪽: 배송 상태 */}
<div
  style={{
    width: "260px",
    background: "#fff",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "360px",
    marginTop: "10px",
  }}
>
  <div>
    <h6 style={{ marginBottom: "15px", fontWeight: "700" }}>배송 상태</h6>

    {getStatusStep(order.status).map((step, idx) => (
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              marginRight: "12px",
              background: step.active ? "#4F8BFF" : "#d1d1d1",
            }}
          ></div>

          <span
            style={{
              color: step.active ? "#4F8BFF" : "#777",
              fontWeight: step.active ? "600" : "400",
              fontSize: "14px",
            }}
          >
            {step.label}
          </span>
        </div>

        {/* <button
  onClick={() => updateStatus(order.id, step.key)}
  disabled={
    step.key === order.status ||
    order.status === "거래완료" ||
    order.status === "환불완료" ||
    order.status === "환불요청" ||
    order.status === "취소요청" ||
    order.status === "취소완료"
  }
  style={{
    width: "100px",
    height: "32px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor:
      step.key === order.status ||
      ["거래완료", "환불완료", "취소완료","환불요청", "취소요청"].includes(order.status)
        ? "not-allowed"
        : "pointer",

    background:
      step.key === order.status ||
      ["거래완료", "환불완료", "취소완료","환불요청", "취소요청"].includes(order.status)
        ? "#cccccc"
        : "#4F8BFF",
    color:
      step.key === order.status ||
      ["거래완료", "환불완료", "취소완료","환불요청", "취소요청"].includes(order.status)
        ? "#666"
        : "#fff",
    border: "none",
    opacity:
      step.key === order.status ||
      ["거래완료", "환불완료", "취소완료","환불요청", "취소요청"].includes(order.status)
        ? 0.7
        : 1,
  }}
>
  {step.label} 변경
</button> */}

      </div>
    ))}
    
    
  </div>

  {/* 배송상태 이미지 박스 (항상 아랫부분에 고정) */}
  <div
    style={{
      height: "100px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "10px",
    }}
  >
    <img
  src={
    order.status === "결제완료"
      ? "/img/payok1.png"
      : order.status === "배송준비"
      ? "/img/deliveryok1.png"
      : order.status === "배송중"
      ? "/img/delivery1.png"
      : order.status === "배송완료"
      ? "/img/deliverydone1.png"

      // 취소 / 환불 상태 추가
      : order.status === "취소요청"
      ? "/img/cancel1.png"
      : order.status === "취소완료"
      ? "/img/cancel1.png"
      : order.status === "환불요청"
      ? "/img/refund_done1.png"
      : order.status === "환불완료"
      ? "/img/refund_done1.png"

      // 기본값
      : "/img/deal_done1.png"
  }
  alt="상태 이미지"
  style={{
    width: "70%",
    height: "100%",
    objectFit: "contain",
    opacity: "0.95",
  }}
/>

  </div>
</div>
</div>

{["결제완료","배송준비", "배송중", "배송완료"].includes(order.status) && (
  <button
    onClick={() => window.open(`/seller/order/${order.id}/qr`, "_blank")}
    style={{
      marginTop: "20px",
      padding: "12px 20px",
      background: "#4F8BFF",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    배송QR 페이지 열기
  </button>
)}





        {/* 환불 사유 + 환불 버튼을 한 줄에 정렬 */}
{order.status === "환불요청" && order.refundReason && (
  <div
    style={{
      background: "#ffffff",
      padding: "18px 20px",
      borderRadius: "10px",
      marginTop: "15px",
      border: "1px solid #e5e5e5",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
    }}
  >
    {/* 상단 타이틀 */}
    <div style={{ marginBottom: "12px" }}>
      <span
        style={{
          background: "#ffefef",
          color: "#d60000",
          padding: "6px 12px",
          borderRadius: "6px",
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        환불 사유
      </span>
    </div>

    {/* 사유 내용 */}
    <div
      style={{
        fontSize: "14px",
        lineHeight: "1.7",
        whiteSpace: "pre-line",
        color: "#444",
        marginBottom: "18px"
      }}
    >
      {order.refundReason}
    </div>

    {/* 버튼 2개 오른쪽 정렬 */}
    <div style={{ textAlign: "right", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
      
      {/* 환불 승인 */}
      <button
        className="admin-btn-danger"
        onClick={() => approveRefund(order.id)}
        style={{
          padding: "8px 14px",
          background: "#e63946",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        환불 승인
      </button>

      {/* 환불 거절 */}
      <button
        className="admin-btn-secondary"
        onClick={() => rejectRefund(order.id)}
        style={{
          padding: "8px 14px",
          background: "#6c757d",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        환불 거절
      </button>
    </div>
  </div>
)}


{order.status === "취소요청" && (
  <div
    style={{
      marginTop: "20px",
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
    }}
  >
    {/* 취소 승인 버튼 */}
    <button
      onClick={() => approveCancel(order.id)}
      style={{
        background: "#2ecc71",       // 초록색
        color: "white",
        padding: "10px 18px",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        cursor: "pointer",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.background = "#27ae60")}
      onMouseLeave={(e) => (e.target.style.background = "#2ecc71")}
    >
      취소 승인
    </button>

    {/* 취소 거절 버튼 */}
    <button
      onClick={() => rejectCancel(order)}
      style={{
        background: "#e74c3c",       // 빨간색
        color: "white",
        padding: "10px 18px",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        cursor: "pointer",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.background = "#c0392b")}
      onMouseLeave={(e) => (e.target.style.background = "#e74c3c")}
    >
      취소 거절
    </button>
  </div>
)}


        
        
      </div>
    </td>
  </tr>
)}

              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

          
          {/* ⭐ 공용 페이징 적용 */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />




    </div>
  );
};

export default SellerOrder;