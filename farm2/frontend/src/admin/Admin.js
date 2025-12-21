import React, { useEffect, useState } from 'react';

import './Admin.css';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminUser from './AdminUser';
import AdminTransaction from './AdminTransaction';
import AdminWithdraw from './AdminWithdraw';
import AdminReport from './AdminReport';
import AdminDashboard from './AdminDashboard';
import { MdSpaceDashboard } from "react-icons/md";
import { FaUser, FaMoneyBillAlt, FaHome, FaCreditCard, FaQuestionCircle, FaBullhorn, FaUserCheck, FaThumbsUp } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import AdminStore from './AdminStore';
import { FiLogOut } from "react-icons/fi";

import AdminNotice from "./AdminNotice";
import AdminSellerApplication from './AdminSellerApplication';

// 초기 샘플 데이터
const initialMarketData = [
  { date: '2025-01', 배추: 3500, 무: 2800, 양파: 4200, 당근: 3200 },
  { date: '2025-02', 배추: 3800, 무: 3100, 양파: 4500, 당근: 3400 },
  { date: '2025-03', 배추: 4200, 무: 3400, 양파: 4800, 당근: 3600 },
  { date: '2025-04', 배추: 3900, 무: 3200, 양파: 4400, 당근: 3300 },
  { date: '2025-05', 배추: 4100, 무: 3500, 양파: 4700, 당근: 3700 },
  { date: '2025-06', 배추: 4400, 무: 3800, 양파: 5000, 당근: 3900 },
];

const initialMarkets = [
  { id: 1, name: '가락시장', location: '서울 송파구', status: '운영중', products: 450, contact: '02-1234-5678' },
  { id: 2, name: '노량진수산시장', location: '서울 동작구', status: '운영중', products: 380, contact: '02-2345-6789' },
  { id: 3, name: '강서농수산물시장', location: '서울 강서구', status: '운영중', products: 520, contact: '02-3456-7890' },
  { id: 4, name: '수원농수산물도매시장', location: '경기 수원시', status: '운영중', products: 410, contact: '031-4567-8901' },
  { id: 5, name: '부평농산물도매시장', location: '인천 부평구', status: '점검중', products: 290, contact: '032-5678-9012' },
];

function Admin() {
  // 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 초기값을 false로
  const [marketData] = useState(initialMarketData);
  const [markets] = useState(initialMarkets);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const location = useLocation();
  const [storedRole, setStoredRole] = useState("");
  const [isChecking, setIsChecking] = useState(true); // 권한 확인 중 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 열림/닫힘 상태
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 권한 체크
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("role");
    const nick = localStorage.getItem("nickname");
    const mailAddress = localStorage.getItem("email");
    const Id = localStorage.getItem("userId");

    console.log("nickname:", nick);
    console.log("email:", mailAddress);
    console.log("userId:", Id);
    console.log("role:", role);
    console.log("isLoggedIn:", loggedIn);

    setIsLoggedIn(loggedIn);
    setStoredRole(role || "");
    setNickname(nick || "");
    setEmail(mailAddress || "");
    setUserId(Id || "");

    // 로그인 안되어있거나 ADMIN이 아니면 접근 불가
    if (!loggedIn || role !== "ROLE_ADMIN") {
      alert("관리자만 접근이 가능한 페이지입니다.");
      window.location.href = "/";
      return;
    }

    // 권한 확인 완료
    setIsChecking(false);
  }, []);

  useEffect(() => {
    const path = location.pathname;

    if (path === '/admin' || path === '/admin/dashboard') {
      setActiveMenu("dashboard");
    } else if (path === "/admin/user") {
      setActiveMenu("users");
    } else if (path === "/admin/transaction") {
      setActiveMenu("transaction");
    } else if (path === "/admin/withdraw") {
      setActiveMenu("withdraw");
    } else if (path === "/admin/report") {
      setActiveMenu("report");
    } else if (path === "/admin/setting") {
      setActiveMenu("settings");
    } else if (path === "/admin/price") {
      setActiveMenu("price");
    } else if (path === "/admin/notice") {
      setActiveMenu("notice");
    } else if (path === "/admin/sellerapplication") {            
      setActiveMenu("sellerapplication");
    }else if (path === "/admin/daystore") {            
      setActiveMenu("daystore");
    }
  }, [location.pathname]);

  // 권한 확인 중이면 로딩 표시
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#999'
      }}>
        로딩 중...
      </div>
    );
  }

  // 권한이 없으면 아무것도 렌더링하지 않음 (이미 리다이렉트됨)
  if (!isLoggedIn || storedRole !== "ROLE_ADMIN") {
    return null;
  }

  // 농산물 목록
  const products = ['배추', '무', '양파', '당근'];

  // 홈으로 버튼
  const homeButton = () => {
    window.location.href = '/';
  }

  // 로그아웃 처리
  const handleLogout = () => {    
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("loginUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("ai-history")) {
        localStorage.removeItem(key);
      }
    });

    setIsLoggedIn(false);
    
    window.location.replace("/");
  };

  return (
    <>
      {isLoggedIn && storedRole === "ROLE_ADMIN" && (    // ROLE_ADMIN인 경우에만 잠깐 보이는 화면도 Admin 화면이 출력되도록
      <div className="admin-container">
        {/* 사이드바 오버레이 (모바일용) */}
        {isSidebarOpen && (
          <div 
            className="admin-sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* 사이드바 */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'admin-sidebar-open' : ''}`}>
                <div className="admin-sidebar-header justify-content-center">
                    <a href='/admin' className="admin-sidebar-title">Admin</a>
                </div>
                
                <nav className="admin-sidebar-nav">
                    <div 
                    className={`admin-nav-item ${activeMenu === 'dashboard' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/dashboard');
                      setIsSidebarOpen(false);
                    }}
                    >
                    <span><MdSpaceDashboard /></span>
                    <span>대시보드</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'users' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                        navigate('/admin/user');
                        setIsSidebarOpen(false);
                    }}
                    >
                    <span><FaUser /></span>
                    <span>사용자 관리</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'transaction' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/transaction');
                      setIsSidebarOpen(false);
                    }}
                    >
                    <span><FaCreditCard /></span>
                    <span>거래 관리</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'withdraw' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/withdraw');
                      setIsSidebarOpen(false);
                    }}
                    >
                    <span><FaMoneyBillAlt /></span>
                    <span>출금 신청 관리</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'report' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/report');
                      setIsSidebarOpen(false);
                    }}
                    >
                    <span><FaQuestionCircle /></span>
                    <span>문의 관리</span>
                    </div>

                    <div
                      className={`admin-nav-item ${activeMenu === 'notice' ? 'admin-nav-item-active' : ''}`}
                      onClick={() => {
                        navigate('/admin/notice');
                      }}
                    >
                      <span><FaBullhorn /></span>
                      <span>공지 관리</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'sellerapplication' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/sellerapplication');
                    }}
                    >
                    <span><FaUserCheck  /></span>
                    <span>판매자 신청 관리</span>
                    </div>

                    <div 
                    className={`admin-nav-item ${activeMenu === 'daystore' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                      navigate('/admin/daystore');
                    }}
                    >
                    <span><FaThumbsUp /></span>
                    <span>추천가게 관리</span>
                    </div>

                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={homeButton}>
                    <span><IoMdHome /></span>
                    <span>홈으로</span>
                    </button>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                    <span><FiLogOut /></span>
                    <span>로그아웃</span>
                    </button>
                </div>
                
            </aside>

        {/* 메인 컨텐츠 */}
        <main className="admin-main-content">
          {/* 헤더 */}
          <header className="admin-header">
            <h2 className="admin-header-title">
              {activeMenu === 'dashboard' && '대시보드'}
              {activeMenu === 'price' && '시세 관리'}
              {activeMenu === 'users' && '사용자 관리'}
              {activeMenu === 'transaction' && '거래 관리'}
              {activeMenu === 'withdraw' && '출금 신청 관리'}
              {activeMenu === 'report' && '문의 관리'}
              {activeMenu === 'notice' && '공지 관리'}
              {activeMenu === 'sellerapplication' && '판매자 신청관리'}
              {activeMenu === 'daystore' && '추천가게 관리'}
            </h2>
            <div className="admin-user-info">
              <div className="admin-user-details">
                <p style={{margin: 0, fontSize: '14px', fontWeight: 500}}>{nickname}</p>
                <small style={{fontSize: '12px', color: '#777'}}>{userId}</small>
              </div>
              <a className="admin-user-avatar" href='/mypage'>{nickname ? nickname.charAt(0) : ""}</a>
            </div>
          </header>

          {/* 컨텐츠 영역 */}
          <div className="admin-content">
            {/* 대시보드 섹션 */}
            {activeMenu === 'dashboard' && (
              <AdminDashboard />
            )}

            {/* 시세 관리 섹션 */}
            {activeMenu === 'price' && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 style={{fontSize: '18px', color: '#333', margin: 0}}>농산물 시세 현황</h3>
                </div>
                <div style={{padding: 0}}>
                  <table className="admin-table">
                    <thead className="admin-thead">
                      <tr>
                        <th className="admin-th">품목</th>
                        <th className="admin-th" style={{textAlign: 'right'}}>현재가</th>
                        <th className="admin-th" style={{textAlign: 'right'}}>전월 대비</th>
                        <th className="admin-th" style={{textAlign: 'right'}}>평균가</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const current = marketData[marketData.length - 1][product];
                        const previous = marketData[marketData.length - 2][product];
                        const change = ((current - previous) / previous * 100).toFixed(1);
                        const avg = Math.round(marketData.reduce((sum, item) => sum + item[product], 0) / marketData.length);
                        
                        return (
                          <tr key={product}>
                            <td className="admin-td">{product}</td>
                            <td className="admin-td" style={{textAlign: 'right', fontWeight: 'bold'}}>
                              {current.toLocaleString()}원
                            </td>
                            <td className="admin-td" style={{textAlign: 'right', fontWeight: 500, color: parseFloat(change) > 0 ? '#e74c3c' : '#3498db'}}>
                              {parseFloat(change) > 0 ? '+' : ''}{change}%
                            </td>
                            <td className="admin-td" style={{textAlign: 'right', color: '#666'}}>
                              {avg.toLocaleString()}원
                            </td>
                            <td className="admin-td" style={{textAlign: 'center'}}>
                              <span className="admin-badge admin-badge-success">정상</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 사용자 관리 섹션 */}
            {activeMenu === 'users' && (
              <AdminUser />
            )}

            {/* 거래 관리 섹션 */}
            {activeMenu === 'transaction' && (
              <AdminTransaction />
            )}

            {/* 출금 신청 관리 섹션 */}
            {activeMenu === 'withdraw' && (
              <AdminWithdraw />
            )}

            {/* 문의 관리 섹션 */}
            {activeMenu === 'report' && (
              <AdminReport />
            )}

              {/* 공지 관리 섹션 */}
            {activeMenu === 'notice' && (
              <AdminNotice />
            )}

            {/* 판매자 신청 관리 섹션 */}
            {activeMenu === 'sellerapplication' && (
              <AdminSellerApplication />
            )}

            {/* 추천가게 섹션 */}
            {activeMenu === 'daystore' && (
              <AdminStore />
            )}
          </div>
        </main>
      </div>
      )}
    </>
  );
}

export default Admin;