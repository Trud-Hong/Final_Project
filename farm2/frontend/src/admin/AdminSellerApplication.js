import React, { useEffect, useState } from "react";
import "./AdminSellerApplication.css";

const AdminSellerApplication = () => {
  const [list, setList] = useState([]);
  const [openUserId, setOpenUserId] = useState(null); // 상세보기 토글

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:8080/api/admin/seller-app", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log("판매자 신청 목록:", data);
        setList(data);
      });
  }, []);

  const approve = async (userId) => {
    if (!window.confirm("승인하시겠습니까?")) return;

    await fetch(`http://localhost:8080/api/admin/seller-app/${userId}/approve`, {
      method: "POST"
    });

    alert("승인 완료!");
    setList(list.filter(item => item.userId !== userId));
  };

  const reject = async (userId) => {
    if (!window.confirm("거절하시겠습니까?")) return;

    await fetch(`http://localhost:8080/api/admin/seller-app/${userId}/reject`, {
      method: "POST"
    });

    alert("거절 완료!");
    setList(list.filter(item => item.userId !== userId));
  };

  const toggleDetail = (userId) => {
    setOpenUserId(openUserId === userId ? null : userId);
  };

  return (
    <div className="admin-card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>사용자</th>
            <th>농장이름</th>
            <th>사업자번호</th>
            <th>전화</th>
            <th>신청일</th>
            <th style={{ textAlign: "center" }}>관리</th>
          </tr>
        </thead>

        <tbody>
          {list.map((m) => (
            <>
              <tr key={m.userId}>
                <td>{m.nickname} ({m.userId})</td>
                <td>{m.sellerApply?.farmName}</td>
                <td>{m.sellerApply?.businessNumber}</td>
                <td>{m.sellerApply?.phone}</td>
                <td>{m.sellerApply?.createdAt?.split("T")[0]}</td>

                <td style={{ textAlign: "center" }}>
                  <button
                    className="action-btn approve-btn"
                    onClick={() => approve(m.userId)}
                  >
                    승인
                  </button>

                  <button
                    className="action-btn reject-btn"
                    onClick={() => reject(m.userId)}
                  >
                    거절
                  </button>
                  
                  <button
                    className="action-btn detail-btn"
                    onClick={() => toggleDetail(m.userId)}
                  >
                    {openUserId === m.userId ? "닫기" : "상세"}
                  </button>
                </td>
              </tr>

              {/* 상세보기 row */}
              {openUserId === m.userId && (
  <tr className="detail-row">
    <td colSpan="6">
      <div className="detail-table-wrapper">

        <table className="detail-table">

          {/* 판매자 정보 */}
          <thead>
            <tr><th colSpan="2" className="section-title">판매자 정보</th></tr>
          </thead>
          <tbody>
            <tr><td>이름</td><td>{m.sellerApply?.sellerName}</td></tr>
            <tr><td>닉네임</td><td>{m.sellerApply?.nickname}</td></tr>
            <tr><td>전화</td><td>{m.sellerApply?.phone}</td></tr>
          </tbody>

          {/* 농장 정보 */}
          <thead>
            <tr><th colSpan="2" className="section-title">농장 정보</th></tr>
          </thead>
          <tbody>
            <tr><td>농장이름</td><td>{m.sellerApply?.farmName}</td></tr>
            <tr><td>소개</td><td>{m.sellerApply?.intro}</td></tr>
            <tr><td>카테고리</td><td>{m.sellerApply?.category}</td></tr>
            <tr><td>주소</td><td>{m.sellerApply?.address}</td></tr>
          </tbody>

          {/* 사업자 정보 */}
          <thead>
            <tr><th colSpan="2" className="section-title">사업자 정보</th></tr>
          </thead>
          <tbody>
            <tr><td>사업자번호</td><td>{m.sellerApply?.businessNumber}</td></tr>
            <tr><td>위치</td><td>{m.sellerApply?.location}</td></tr>
          </tbody>

          {/* 정산 정보 */}
          <thead>
            <tr><th colSpan="2" className="section-title">정산 정보</th></tr>
          </thead>
          <tbody>
            <tr><td>은행</td><td>{m.sellerApply?.bank}</td></tr>
            <tr><td>계좌번호</td><td>{m.sellerApply?.accountNumber}</td></tr>
          </tbody>

        </table>

      </div>
    </td>
  </tr>
)}

            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSellerApplication;
