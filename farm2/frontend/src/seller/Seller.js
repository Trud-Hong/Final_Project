// src/pages/Seller.jsx
import React, { useEffect, useState } from 'react';
import './Admin.css';
import { useLocation, useNavigate } from 'react-router-dom';

import { MdSpaceDashboard, MdReport } from "react-icons/md";
import { FaClipboardList, FaShoppingCart, FaHome } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";

// 판매자 서브 페이지
import SellerDashboard from './SellerDashboard';
import SellerProductList from './SellerProductList';
import SellerProductCreate from './SellerProductCreate';
import SellerOrder from './SellerOrder';
import SellerQuestion from './SellerQuestion';
import SellerSetting from './SellerSetting';

function Seller() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [storedRole, setStoredRole] = useState("");

  const [isChecking, setIsChecking] = useState(true);
  const [mySeller, setMySeller] = useState(null);

  // 🔴 미답변 카운트
  const [unansweredCount, setUnansweredCount] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  /* ==========================
      ✔ 권한 체크
  ========================== */
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("role");
    const nick = localStorage.getItem("nickname");
    const mail = localStorage.getItem("email");
    const uid = localStorage.getItem("userId");

    setIsLoggedIn(loggedIn);
    setStoredRole(role || "");
    setNickname(nick || "");
    setEmail(mail || "");
    setUserId(uid || "");

    if (!loggedIn || role !== "ROLE_SELLER") {
      alert("판매자만 접근 가능한 페이지입니다.");
      window.location.href = "/";
      return;
    }

    setIsChecking(false);
  }, []);

  /* ==========================
      ✔ 판매자 정보 로드
  ========================== */
  useEffect(() => {
    const uid = localStorage.getItem("userId");

    fetch(`http://localhost:8080/seller/list`)
      .then(res => res.json())
      .then(data => {
        const seller = data.find(s => s.userId === uid);
        setMySeller(seller);
      })
      .catch(err => console.error("판매자 정보 로딩 오류:", err));
  }, []);

  /* ======================================================
      ⭐ 수정 A 적용 버전: loadUnansweredCount()
  ====================================================== */
  const loadUnansweredCount = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/products/qna/seller/unanswered/count?sellerId=${userId}`
      );

      const text = await res.text();
      let count = 0;

      if (!isNaN(text)) {
        // 단순 숫자 응답
        count = parseInt(text);
      } else {
        // JSON 응답
        const json = JSON.parse(text);
        count = json.count ?? json.data ?? json.unanswered ?? 0;
      }

      setUnansweredCount(count);

      // 저장 (B 버전과 섞이지 않도록 저장만 하고 불러오지는 않음)
      localStorage.setItem("unansweredQnA", count);

    } catch (err) {
      console.error("미답변 QnA 불러오기 오류:", err);
      setUnansweredCount(0);
    }
  };

  /* ==========================
      ⭐ userId 로딩 후 API 호출
  ========================== */
  useEffect(() => {
    if (!userId || userId.trim() === "") return;
    loadUnansweredCount();
  }, [userId]);

  /* ==========================
      ✔ storage 이벤트로 동기화
  ========================== */
  useEffect(() => {
    const updateBadge = () => {
      const saved = localStorage.getItem("unansweredQnA");
      setUnansweredCount(
        saved !== null && saved !== "" ? parseInt(saved) : 0
      );
    };

    window.addEventListener("storage", updateBadge);
    return () => window.removeEventListener("storage", updateBadge);
  }, []);

  /* ==========================
      ✔ URL 기준 메뉴 활성화
  ========================== */
  useEffect(() => {
    const path = location.pathname;

    if (path === "/seller" || path === "/seller/dashboard") {
      setActiveMenu("dashboard");
    } 
    else if (path === "/seller/product") {
      setActiveMenu("product");
    }
    else if (path === "/seller/product/create") {
      setActiveMenu("product-create");
    }
    else if (path === "/seller/order") {
      setActiveMenu("order");
    }
    else if (path === "/seller/question") {
      setActiveMenu("question");
    }
    else if (path === "/seller/settings") {
      setActiveMenu("settings");
    }
  }, [location.pathname]);

  /* ==========================
      ✔ 로딩 화면 처리
  ========================== */
  if (isChecking) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#999"
      }}>
        로딩 중...
      </div>
    );
  }

  if (!isLoggedIn || storedRole !== "ROLE_SELLER") return null;

  /* ==========================
      ✔ 버튼 기능
  ========================== */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const goHome = () => {
    window.location.href = "/";
  };

  /* ==========================
      ⭐ 전체 렌더링
  ========================== */
  return (
    <div className="admin-container">

      {/* ==== 사이드바 ==== */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-header justify-content-center">
          <a href="/seller" className="admin-sidebar-title">Seller</a>
        </div>

        <nav className="admin-sidebar-nav">

          {/* 대시보드 */}
          <div
            className={`admin-nav-item ${activeMenu === "dashboard" ? "admin-nav-item-active" : ""}`}
            onClick={() => navigate("/seller/dashboard")}
          >
            <MdSpaceDashboard />
            <span>대시보드</span>
          </div>

          {/* 상품관리 */}
          <div
            className={`admin-nav-item ${(activeMenu === "product" || activeMenu === "product-create") ? "admin-nav-item-active" : ""}`}
            onClick={() => navigate("/seller/product")}
          >
            <FaClipboardList />
            <span>상품 관리</span>
          </div>

          {/* 주문관리 */}
          <div
            className={`admin-nav-item ${activeMenu === "order" ? "admin-nav-item-active" : ""}`}
            onClick={() => navigate("/seller/order")}
          >
            <FaShoppingCart />
            <span>주문 관리</span>
          </div>

          {/* 문의관리 */}
          <div
            className={`admin-nav-item ${activeMenu === "question" ? "admin-nav-item-active" : ""}`}
            onClick={() => navigate("/seller/question")}
            style={{ position: "relative" }}
          >
            <MdReport />
            <span>문의 관리</span>

            {/* 🔴 빨간 점 */}
            {unansweredCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  width: "10px",
                  height: "10px",
                  background: "red",
                  borderRadius: "50%",
                  display: "inline-block"
                }}
              ></span>
            )}
          </div>

          {/* 설정 */}
          <div
            className={`admin-nav-item ${activeMenu === "settings" ? "admin-nav-item-active" : ""}`}
            onClick={() => {
              if (!mySeller) {
                alert("판매자 정보를 불러오는 중입니다...");
                return;
              }
              navigate("/seller/settings");
            }}
          >
            <IoMdSettings />
            <span>판매자 정보 수정</span>
          </div>

        </nav>

        {/* 사이드바 푸터 */}
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={goHome}>
            <FaHome />
            <span>홈으로</span>
          </button>

          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>로그아웃</span>
          </button>
        </div>

      </aside>

      {/* ==== 메인 컨텐츠 ==== */}
      <main className="admin-main-content">

        <header className="admin-header">
          <h2 className="admin-header-title">
            {activeMenu === "dashboard" && "판매자 대시보드"}
            {activeMenu === "product" && "상품 관리"}
            {activeMenu === "product-create" && "상품 등록"}
            {activeMenu === "order" && "주문 관리"}
            {activeMenu === "question" && "문의 관리"}
            {activeMenu === "settings" && "판매자 설정"}
          </h2>

          <div className="admin-user-info">
            <div className="admin-user-details">
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>{nickname}</p>
              <small style={{ fontSize: "12px", color: "#777" }}>{userId}</small>
            </div>

            <a className="admin-user-avatar" href="/mypage">
              {nickname ? nickname.charAt(0) : ""}
            </a>
          </div>
        </header>

        <div className="admin-content">
          {activeMenu === "dashboard" && <SellerDashboard mySeller={mySeller} />}
          {activeMenu === "product" && <SellerProductList />}
          {activeMenu === "product-create" && <SellerProductCreate />}
          {activeMenu === "order" && <SellerOrder />}
          {activeMenu === "question" && <SellerQuestion />}
          {activeMenu === "settings" && <SellerSetting seller={mySeller} />}
        </div>

      </main>
    </div>
  );
}

export default React.memo(Seller);
