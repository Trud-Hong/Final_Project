import React, { useState } from 'react';
import { MdSpaceDashboard, MdReport } from "react-icons/md";
import { FaUser, FaMoneyBillAlt } from "react-icons/fa";
import { IoMdSettings, IoMdHome } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";

const AdminSidebar = () => {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false); // 초기값을 false로

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
        setIsLoggedIn(false);
        window.location.href = "/";
    };
    
    return (
        <div>
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header justify-content-center">
                    <a href='/admin' className="admin-sidebar-title">Admin</a>
                </div>
                
                <nav className="admin-sidebar-nav">
                    <div 
                    className={`admin-nav-item ${activeMenu === 'dashboard' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => setActiveMenu('dashboard')}
                    >
                    <span><MdSpaceDashboard /></span>
                    <span>대시보드</span>
                    </div>
                    <div 
                    className={`admin-nav-item ${activeMenu === 'users' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => {
                        setActiveMenu('users')
                        window.location.href = '/admin/user'
                    }}
                    >
                    <span><FaUser /></span>
                    <span>사용자 관리</span>
                    </div>
                    <div 
                    className={`admin-nav-item ${activeMenu === 'transaction' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => setActiveMenu('transaction')}
                    >
                    <span><FaMoneyBillAlt /></span>
                    <span>거래 관리</span>
                    </div>
                    <div 
                    className={`admin-nav-item ${activeMenu === 'report' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => setActiveMenu('report')}
                    >
                    <span><MdReport /></span>
                    <span>문의 관리</span>
                    </div>
                    <div
                    className={`admin-nav-item ${activeMenu === 'notice' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => go("notice", "/admin/notice")}
                    >
                    <span><MdReport /></span>
                    <span>공지 관리</span>
                    </div>
                    <div 
                    className={`admin-nav-item ${activeMenu === 'settings' ? 'admin-nav-item-active' : ''}`}
                    onClick={() => setActiveMenu('settings')}
                    >
                    <span><IoMdSettings /></span>
                    <span>설정</span>
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
        </div>
    );
};

export default AdminSidebar;