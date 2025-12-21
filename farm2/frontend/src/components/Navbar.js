// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import SearchBox from './SearchBox';
import { FaXTwitter, FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa6";;

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const provider = localStorage.getItem("provider") || "normal";

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [nickname, setNickname] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const [userRole, setUserRole] = useState("");
    const [mileageBalance, setMileageBalance] = useState(0);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [hjHover, setHjHover] = useState(false);
    const [mnHover, setMnHover] = useState(false);

    useEffect(() => {
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const user = localStorage.getItem("username");
        const nick = localStorage.getItem("nickname");
        const role = localStorage.getItem("role");

        setIsLoggedIn(loggedIn);
        setUsername(user || "");
        setNickname(nick || "");
        setUserRole(role || "");
    }, [location.pathname]);

    // useEffect(() => {
    //     const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    //     const user = localStorage.getItem("username");

    //     setIsLoggedIn(loggedIn);
    //     setUsername(user || "");
    // }, [location.pathname]);

    // 마일리지 잔액 조회
    useEffect(() => {
        const fetchMileageBalance = async () => {
            const token = localStorage.getItem("token");
            const loggedIn = localStorage.getItem("isLoggedIn") === "true";
            
            if (!loggedIn || !token) {
                setMileageBalance(0);
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/api/mileage/balance', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setMileageBalance(data.balance || 0);
                }
            } catch (error) {
                console.error('마일리지 조회 실패:', error);
            }
        };

        if (isLoggedIn) {
            fetchMileageBalance();
        }
    }, [isLoggedIn, location.pathname]);

    // 검색창 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSearchOpen]);

    // 검색 버튼 클릭 핸들러
    const handleSearchClick = (e) => {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
    };

    // 로그아웃 처리
    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("loginUser");
        localStorage.removeItem("userId"); 
        localStorage.removeItem("provider");
        setIsLoggedIn(false);
        window.location.href = "/";
    };

    // 현재 URL이 드롭다운 메뉴 경로인지 확인
    const isSellingPage =
        location.pathname === "/blog" ||
        location.pathname === "/feature" ||
        location.pathname === "/testimonial";

    const isPricePage = 
        location.pathname === "/about" ||
        location.pathname === "/predict";

    const isUserPage = 
        location.pathname === "/mypage";

    const isUpdatePage = 
        location.pathname === "/mypage/p_update";

    const isOrderlistPage = 
        location.pathname === "/mypage/orderlist";

    // NavLink 스타일 자동 적용
    const getNavClass = ({ isActive }) =>
        "nav-item nav-link" + (isActive ? " active fw-bold" : "");

    // 검색창 컴포넌트
    const SearchDropdown = () => (
        <>
            <a 
                className="btn-sm-square bg-white rounded-circle ms-3" 
                href="#"
                onClick={handleSearchClick}
                style={{ cursor: 'pointer' }}
            >
                <small className="fa fa-search text-body"></small>
            </a>
            
            {/* 검색창 드롭다운 */}
            <SearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );

    const role = localStorage.getItem("role");

    return (
        <>
            <div className="container-fluid fixed-middle px-0 bg-white shadow" data-wow-delay="0.1s"
            style={{
                zIndex: 1030,
                top: 0,
                position: 'sticky',
            }}>
                
                {/* ---------- Top Bar ---------- */}
                <div className="top-bar row gx-0 align-items-center d-none d-lg-flex">
                    <div className="col-lg-6 px-5 text-start">
                        <small><i className="fa fa-map-marker-alt me-2"></i>수원시 인계동 휴먼IT교육</small>
                        <small className="ms-4"><i className="fa fa-envelope me-2"></i>farm@example.com</small>
                    </div>
                    <div className="col-lg-6 px-5 text-end">
                        {isLoggedIn && (
                            userRole === "ROLE_ADMIN" ? (
                                <a className='m-3' href='/admin'>admin</a>
                            ) : userRole === "ROLE_SELLER" ? (
                                <a className='m-3' href='/seller'>판매 상품관리</a>
                            ) : null
                        )}

                        <small>Other Link :</small>
                        <a className="text-body ms-3" href="https://www.facebook.com/"><FaFacebookF /></a>
                        <a className="text-body ms-3" href="https://x.com/"><FaXTwitter /></a>
                        <a className="text-body ms-3" href="https://kr.linkedin.com/"><FaLinkedinIn /></a>
                        <a className="text-body ms-3" href="https://www.instagram.com/"><FaInstagram /></a>
                    </div>
                </div>

                {/* ---------- Navbar ---------- */}
                <nav className="navbar navbar-expand-lg navbar-light py-lg-0 px-lg-5 wow fadeIn" data-wow-delay="0.1s">
                    
                    {/* 로고 */}
                    <Link to="/" className="navbar-brand ms-4 ms-lg-0">
                        {/* <h1 className="fw-bold text-primary m-0">
                            F<span className="text-secondary">ar</span>m
                        </h1> */}
                        <img src="/img/Farm.jpg" alt="Logo" style={{ width: "100px", height: "auto" }} />
                    </Link>

                    {/* 모바일 메뉴 버튼 */}
                    <button 
                        type="button"
                        className="navbar-toggler me-4"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarCollapse"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* 메뉴 목록 */}
                    <div className="collapse navbar-collapse" id="navbarCollapse">

                        <div className="navbar-nav ms-auto p-4 p-lg-0">
                            
                            {isLoggedIn && userRole === "ROLE_SELLER" && (
                                <NavLink to="/seller/products" className={getNavClass}>
                                    물품등록
                                </NavLink>
                            )}

                            {/* <NavLink to="/about" className={getNavClass}>
                                가격추세
                            </NavLink> */}

                            <NavLink to="/products" className={getNavClass}>
                                농산물
                            </NavLink>

                            {/* <NavLink to="/predict" className={getNavClass}>
                                AI가격 예측
                            </NavLink> */}

                            {/* ▼ 드롭다운: 가격 관련 */}
                            <div className="nav-item dropdown">
                                {/* 부모 메뉴에 active 적용 */}
                                <a
                                    href="#"
                                    className={`nav-link dropdown-toggle ${isPricePage ? "active fw-bold" : ""}`}
                                    data-bs-toggle="dropdown"
                                >
                                    가격정보
                                </a>

                                <div className="dropdown-menu m-0">
                                        <NavLink to="/about" className="dropdown-item">가격 추세</NavLink>
                                    <NavLink to="/predict" className="dropdown-item">AI 가격 예측</NavLink>
                                </div>
                            </div>

                            {/* ▼ 드롭다운: 판매정보 */}
                            <div className="nav-item dropdown">

                                {/* 부모 메뉴에 active 적용 */}
                                <a
                                    href="#"
                                    className={`nav-link dropdown-toggle ${isSellingPage ? "active fw-bold" : ""}`}
                                    data-bs-toggle="dropdown"
                                >
                                    판매정보
                                </a>

                                <div className="dropdown-menu m-0">
                                        <NavLink to="/sellerinfo" className="dropdown-item">판매자</NavLink>
                                    <NavLink to="/feature" className="dropdown-item">농산물 정보</NavLink>
                                    
                                    <NavLink to="/sns" className="dropdown-item">커뮤니티</NavLink>
                                    <NavLink to="/market" className="dropdown-item">시장 정보</NavLink>
                                </div>
                            </div>

                            <NavLink to="/notice" className={getNavClass}>
                                공지사항
                            </NavLink>
                        </div>

                        {/* ---------- 로그인/로그아웃 버튼 ---------- */}
                        <div className="d-none d-lg-flex ms-2 align-items-center">

                            {/* 검색 버튼 (공통 영역) */}
                            <div className="d-none d-lg-flex ms-0 position-relative" ref={searchRef}>
                                <SearchDropdown />
                            </div>
                            {/* 로그인 상태일 때 */}
                            {isLoggedIn ? (
                                <>
                                    {/* 아이콘들 */}
                                    <div className="d-none d-lg-flex me-3">
                                        {/* ------- 혜정 마이페이지, 장바구니 아이콘 연결 ------- */}
                                        <a className="btn-sm-square bg-white rounded-circle ms-3" href="/wishlist">
                                            <small className="fa fa-heart text-body"></small>

                                        </a>
                                    </div>

                                    {/* 마일리지 표시 및 충전/출금 버튼 */}
                                    <div className="d-flex align-items-center p-2 bg-light rounded" style={{ gap: '8px' }}>
                                        <i className="fa fa-coins text-warning" style={{ fontSize: '18px' }}></i>
                                        <span className="fw-bold text-primary" style={{ fontSize: '14px' }}>
                                            {mileageBalance.toLocaleString()}원
                                        </span>
                                        <button
                                            className="btn btn-sm btn-success px-2 py-1"
                                            onClick={() => {
                                                navigate('/mileage?menu=charge');
                                            }}
                                            style={{ fontSize: '11px', lineHeight: '1.2' }}
                                        >
                                            <i className="fa fa-plus me-1"></i>충전
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-primary px-2 py-1"
                                            onClick={() => {
                                                navigate('/mileage?menu=withdraw');
                                            }}
                                            style={{ fontSize: '11px', lineHeight: '1.2' }}
                                        >
                                            <i className="fa fa-minus me-1"></i>출금
                                        </button>
                                    </div>


                                    {/* ▼ 드롭다운: 마이페이지 */}
                                    <div className="nav-item dropdown">
                                        {/* 부모 메뉴에 active 적용 */}
                                        <div
                                            onMouseEnter={() => {
                                                setHjHover(true);
                                                setShowUserMenu(true);
                                            }}

                                            onMouseLeave={() => {
                                                setHjHover(false);
                                                setShowUserMenu(false);
                                            }}
                                            style={{ 
                                                cursor: "pointer",
                                                color: hjHover ? "#3cb815" : "#0000008c",
                                                fontWeight: hjHover ?  "900" : "bold"
                                            }}

                                            onClick={() => navigate("/mypage")}
                                            className={'nav-link'}
                                            data-bs-toggle="dropdown"
                                        >
                                            {nickname}님
                                        </div>

                                        <div className="dropdown-menu m-0">
                                            <NavLink to="/mypage" end className={({ isActive }) => `dropdown-item ${isActive ? "active" : ""}`}>마이 페이지</NavLink>
                                            {provider === "normal" ? (
                                                <NavLink to="/mypage/p_update" className={({ isActive }) => `dropdown-item ${isActive ? "active" : ""}`}>회원 정보 수정</NavLink>
                                            ) : (
                                                <NavLink to="/mypage/p_update/edit" className={({ isActive }) => `dropdown-item ${isActive ? "active" : ""}`}>회원 정보 수정</NavLink>
                                            )}
                                            <NavLink to="/mypage/orderlist" className={({ isActive }) => `dropdown-item ${isActive ? "active" : ""}`}>내 주문 내역</NavLink>
                                        </div>
                                    </div>

{/*   아래서부터 11/28 혜정 마이페이지 기능 추가     */}
                                {/* <div 
                                    className = "position-relative me-3"
                                    onMouseEnter={() => {
                                    setHjHover(true);
                                    setShowUserMenu(true);
                                    }}

                                    onMouseLeave={() => {
                                    setHjHover(false);
                                    setShowUserMenu(false);
                                    }}
                                >

                                <div 
                                    className='fw-bold'
                                    style={{ cursor: "pointer",
                                    color: hjHover ? "#3cb815" : "#0000008c",
                                    fontWeight: hjHover ?  "900" : "bold"}}

                                    onClick={() => navigate("/mypage")}>
                                    {nickname}님
                                    </div> */}

{/* 위 코딩 추가하면서 기존코딩 주석처리함 11/28 혜정 */}
                                    {/* <a href='/mypage' className="me-3 fw-bold" style={{color: '#0000008c'}}>{nickname}님</a> */}

                                    {/* {showUserMenu && (
                                        <div
                                            className="position-absolute "
                                            style={{
                                                top: "100%",
                                                left: "-80%",

                                                padding: "5px 0px",
                                                width: "120px", //박스크기(넓이)

                                                backgroundColor: "#ffffff",
                                                borderRadius: "15px", //둥근모서리
                                                boxShadow: "0 5px 10px #aaaaaaff", //박스 그림자
                                                border: "1px solid #e9e8e8ff",

                                                fontSize: "15px",
                                                lineHeight: "1" //라인 자간 
                                            }}
                                        >

                                        <div
                                            className='p-2 hover-bg'
                                            style={{ cursor: "pointer",
                                            color: mnHover === "mypage" ? "#3cb815" : "#0000008c",
                                            fontWeight: mnHover === "mypage" ? "900" : "bold"
                                        }}

                                            onMouseEnter={() => 
                                            setMnHover("mypage")}

                                            onMouseLeave={() => 
                                            setMnHover(null) }
                                            onClick={() => navigate("/mypage")}

                                        >마이 페이지</div>

                                        <div
                                            className="p-2 hover-bg"
                                            style={{ cursor: "pointer",
                                            color: mnHover === "p_update" ? "#3cb815" : "#0000008c",
                                            fontWeight: mnHover === "p_update" ? "900" : "bold"
                                            }}

                                            onMouseEnter={() => 
                                            setMnHover("p_update")}

                                            onMouseLeave={() => 
                                            setMnHover(null) }

                                            onClick={() => navigate("/mypage/p_update")}
                                        >회원정보수정</div>

                                        <div 
                                            className="p-2 hover-bg"
                                            style={{ cursor: "pointer",
                                            color: mnHover === "orderlist" ? "#3cb815" : "#0000008c",
                                            fontWeight: mnHover === "orderlist" ? "900" : "bold"
                                        }}
                                            
                                            onMouseEnter={() => 
                                            setMnHover("orderlist")}

                                            onMouseLeave={() => 
                                            setMnHover(null) }

                                            onClick={() => navigate("/mypage/orderlist")}
                                        >나의구매내역</div>
                                        </div>
                                    )}
                                </div> */}
                                {/*   여기까지 11/28 혜정 코딩 추가 내역  */}


                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-outline-danger btn-sm"
                                    >
                                        로그아웃
                                    </button>

                                </>
                            ) : (
                                /* 로그아웃 상태일 때 */
                                <>
                                    <Link
                                        to="/login"
                                        className="btn btn-outline-primary btn-sm me-2 ms-4"
                                    >
                                        로그인
                                    </Link>

                                    <Link
                                        to="/signup"
                                        className="btn btn-primary btn-sm"
                                    >
                                        회원가입
                                    </Link>
                                </>
                            )}

                        </div>
                    </div>
                </nav>
            </div>
        </>
    );
};

export default Navbar;