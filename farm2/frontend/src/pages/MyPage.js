import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import GotoBack from "../components/GotoBack";

import "../css/MyPage.css";

const MyPage = () => {

    const userId = localStorage.getItem("userId") || "guest";
    const name = localStorage.getItem("username") || "guest";
    const role = localStorage.getItem("role") || "ROLE_USER";
    const provider = localStorage.getItem("provider") || "normal";
    const navigate = useNavigate();


    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [productNames, setProductNames] = useState({});
    const [mySeller, setMySeller] = useState(null);
    const [sellerSubMenu, setSellerSubMenu] = useState(null);
    const [myProducts, setMyProducts] = useState([]);
    const [member, setMember] = useState(null);
    const [recentOrdersCurrentPage, setRecentOrdersCurrentPage] = useState(1);
    const recentOrdersItemsPerPage = 5;

    //지원
    const [unansweredCount, setUnansweredCount] = useState(0);


    const [activeTab, setActiveTab] = useState(role === "ROLE_SELLER" ? "seller" : "user");

    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (role === "ROLE_SELLER" && userId && userId !== "") {
            setReady(true);
        }
    }, [role, userId]);

    //페이징
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 8;
    const pagedProducts = myProducts.slice(
        currentPage*itemsPerPage,
        currentPage*itemsPerPage+itemsPerPage
    );

    const API_URL = "http://localhost:8080/api/orders";

    // 로그인 체크
    const checkLogin = () => {
        const loginUserId = localStorage.getItem("userId");
        if (loginUserId) {
            return true;
        } else {
            alert("로그인이 필요한 서비스입니다.");
            const currentPath = window.location.pathname;
            window.location.replace(
                "/login?redirect=" + encodeURIComponent(currentPath)
            );
            return false;
        }
    };

    // 상품 정보 가져오기
    const fetchProductName = async (productId) => {
        if (!productId || productNames[productId]) return productNames[productId];
        try {
            const response = await fetch(`http://localhost:8080/products/detail/${productId}`);
            if (response.ok) {
                const product = await response.json();
                if (product && product.name) {
                    setProductNames(prev => ({ ...prev, [productId]: product.name }));
                    return product.name;
                }
            }
        } catch (error) {
            console.error(`상품 정보 조회 실패 (productId: ${productId}):`, error);
        }
        return null;
    };

    // 최근 3개월 구매내역
    const seDalOrders = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const threeMonthAgo = new Date();
            threeMonthAgo.setMonth(today.getMonth() - 3);

            // OrderList.js와 동일한 형식으로 변환 (YYYY-MM-DDTHH:mm:ss)
            // 시작일은 00:00:00, 종료일은 23:59:59로 설정
            const formatStartDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}T00:00:00`;
            };

            const formatEndDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}T23:59:59`;
            };

            const startDate = formatStartDate(threeMonthAgo);
            const endDate = formatEndDate(today);

            console.log("조회 기간:", startDate, "~", endDate);
            console.log("사용자 ID:", userId);

            const response = await fetch(
                `${API_URL}/period?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API 응답 오류:", response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("최근 3개월 구매내역 응답:", data);

            if (Array.isArray(data) && data.length > 0) {
                const sortedData = data.sort(
                    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
                );
                console.log("정렬된 구매내역:", sortedData.length, "건");
                
                // productId가 있지만 pName이 없는 경우 상품 정보 가져오기
                const productIds = sortedData
                    .filter(order => order.productId && (!order.pname || order.pname === '상품명 없음'))
                    .map(order => order.productId);
                
                // 중복 제거
                const uniqueProductIds = [...new Set(productIds)];
                
                // 병렬로 상품 정보 가져오기 및 결과 저장
                const productNameMap = {};
                const productPromises = uniqueProductIds.map(async (productId) => {
                    const productName = await fetchProductName(productId);
                    if (productName) {
                        productNameMap[productId] = productName;
                    }
                });
                await Promise.all(productPromises);
                
                // pName이 없는 주문에 대해 상품명 업데이트
                sortedData.forEach(order => {
                    if (order.productId && (!order.pname || order.pname === '상품명 없음' || order.pname.trim() === '')) {
                        const fetchedName = productNameMap[order.productId];
                        if (fetchedName) {
                            order.pname = fetchedName;
                        }
                    }
                });
                
                setRecentOrders(sortedData);
            } else {
                console.log("구매내역이 없습니다. (응답 데이터:", data, ")");
                setRecentOrders([]);
            }
            setRecentOrdersCurrentPage(1); // 데이터 로드 시 첫 페이지로 리셋
        } catch (error) {
            console.error("구매내역 조회 오류:", error);
            setRecentOrders([]);
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const y = date.getFullYear();
        const m = ("0" + (date.getMonth() + 1)).slice(-2);
        const d = ("0" + date.getDate()).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        return `${y}년 ${m}월 ${d}일 ${hours}:${minutes}`;
    };

    useEffect(() => {
  console.log("=== Member 정보 로드 시작 ===");
  console.log("userId:", userId);
  
  fetch(`http://localhost:8080/api/member/user/${userId}`)
    .then(res => {
      console.log("Member API 응답 상태:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("Member API 응답 데이터:", data);
      console.log("member.sellerApply:", data?.sellerApply);
      console.log("member.sellerApply?.status:", data?.sellerApply?.status);
      console.log("member.sellerApply?.applied:", data?.sellerApply?.applied);
      console.log("member.role:", data?.role);
      setMember(data);
      console.log("=== Member 정보 로드 완료 ===");
    })
    .catch(err => {
      console.error("회원 정보 불러오기 실패:", err);
    });
}, [userId]);

    // 판매자 여부 확인
    useEffect(() => {
        fetch("http://localhost:8080/seller/list")
            .then((res) => res.json())
            .then((data) => {
                const seller = data.find((s) => s.userId === userId);
                setMySeller(seller);
            })
            .catch((err) => console.error(err));
    }, [userId]);

    // 로그인 필요한 기능 체크
    useEffect(() => {
        if (!checkLogin()) return;
    }, []);

    // 구매내역 조회
    useEffect(() => {
        if (userId !== "") {
            seDalOrders();
        }
    }, [userId]);

    // 지원
    useEffect(() => {
        if (!ready) return;

        fetch(`http://localhost:8080/products/qna/seller/unanswered/count?sellerId=${userId}`)
            .then(res => res.json())
            .then(count => {

                // ⭐ count는 숫자
                const newCount = Number(count);

                // ❗ count === 0 이라도 그대로 반영해야 한다.
                setUnansweredCount(newCount);
                localStorage.setItem("unansweredQnA", String(newCount));
                window.dispatchEvent(new Event("storage"));
            })
            .catch(err => console.error("전체 미답변 조회 오류:", err));

    }, [ready]);


    // 판매자 상품 관리 조회
    useEffect(() => {
    if (sellerSubMenu === "manage" && mySeller) {
        
        // sellerId 또는 userId 중 Product 저장된 값과 일치하는 값 사용
        const sellerKey = mySeller.userId;

        fetch(`http://localhost:8080/seller/products/list/${sellerKey}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => res.json())
            .then(async data => {
                console.log("📦 서버 응답:", data);

                if (Array.isArray(data)) {

                    // ⭐ 지원 수정: 상품별 미답변 개수 포함
                    const updatedProducts = await Promise.all(
                        data.map(async (p) => {
                            try {
                                const res = await fetch(`http://localhost:8080/products/${p.id}/qna/unanswered/count`);
                                const count = await res.json();
                                return { ...p, unansweredCount: Number(count) || 0 };
                            } catch {
                                return { ...p, unansweredCount: 0 };
                            }
                        })
                    );

                    setMyProducts(updatedProducts);

                } else {
                    setMyProducts([]);
                }
            })

            .catch(err => console.error(err));
    }
}, [sellerSubMenu, mySeller]);

const renderSellerButton = () => {
  console.log("=== renderSellerButton 시작 ===");
  console.log("role (localStorage):", role);
  console.log("member:", member);
  console.log("mySeller:", mySeller);

  // 관리자면 버튼 숨김 (role 변수 확인)
  if (role === "ROLE_ADMIN") {
    console.log("❌ 관리자 (role) - 버튼 숨김");
    return null;
  }

  // member가 로드되지 않았으면 로딩 표시
  if (!member) {
    console.log("⏳ member 로딩 중...");
    return (
      <div className="text-muted">로딩 중...</div>
    );
  }

  console.log("member.role:", member.role);
  console.log("member.sellerApply:", member.sellerApply);

  // 관리자면 버튼 숨김 (member.role 확인)
  if (member.role === "ROLE_ADMIN") {
    console.log("❌ 관리자 (member.role) - 버튼 숨김");
    return null;
  }

  const apply = member.sellerApply;
  console.log("apply 객체:", apply);
  console.log("apply?.status:", apply?.status);
  console.log("apply?.applied:", apply?.applied);

  // sellerApply가 존재하고 status가 있는 경우, status를 우선 확인
  if (apply && apply.status) {
    console.log("✅ apply.status 존재:", apply.status);
    
    // APPROVED: 판매자 승인 완료
    if (apply.status === "APPROVED") {
      console.log("✅ APPROVED 상태 - 승인 버튼 표시");
      return (
        <button 
          className="seller-btn seller-approved" 
          onClick={() => navigate("/seller/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <i className="bi bi-check-circle"></i> 판매자 등록이 승인되었습니다. (판매자 대시보드로 이동)
        </button>
      );
    }

    // PENDING: 승인 대기중
    if (apply.status === "PENDING") {
      console.log("⏳ PENDING 상태 - 심사중 버튼 표시");
      return (
        <button className="seller-btn seller-pending" disabled>
          <i className="bi bi-hourglass-split"></i> 판매자 등록 심사중입니다.
        </button>
      );
    }

    // REJECTED: 거절됨 → 재신청 버튼
    if (apply.status === "REJECTED") {
      console.log("❌ REJECTED 상태 - 재신청 버튼 표시");
      return (
        <button className="seller-btn seller-rejected" onClick={() => navigate("/seller/register")}>
          <i className="bi bi-exclamation-triangle"></i> 판매자 재신청하기
        </button>
      );
    }

    console.log("⚠️ apply.status가 있지만 예상하지 못한 값:", apply.status);
  } else {
    console.log("⚠️ apply 또는 apply.status가 없음");
    console.log("  - apply 존재:", !!apply);
    console.log("  - apply.status 존재:", !!(apply && apply.status));
  }

  // sellerApply가 없거나 applied가 false인 경우 → 판매자 신청한 적 없음
  if (!apply || !apply.applied) {
    console.log("📝 신청한 적 없음 - 신청 버튼 표시");
    console.log("  - apply 없음:", !apply);
    console.log("  - apply.applied false:", apply && !apply.applied);
    return (
      <button className="seller-btn seller-normal" onClick={() => navigate("/seller/register")}>
        <i className="bi bi-person-plus"></i> 판매자 등록 신청
      </button>
    );
  }

  console.log("⚠️ 모든 조건을 통과하지 못함 - null 반환");
  console.log("=== renderSellerButton 종료 ===");

  // 판매자 승인된 상태 확인 (sellerApply.status가 없거나 다른 경우, role이나 mySeller로 확인)
  // 1. localStorage의 role 확인
  // 2. member.role 확인
  // 3. mySeller 존재 여부 확인
  const isSeller = role === "ROLE_SELLER" || 
                   member.role === "ROLE_SELLER" || 
                   (mySeller !== null);

  if (isSeller) {
    return (
      <button 
        className="seller-btn seller-approved" 
        onClick={() => navigate("/seller/dashboard")}
        style={{ cursor: "pointer" }}
      >
        <i className="bi bi-check-circle"></i> 판매자 등록이 승인되었습니다. (판매자 대시보드로 이동)
      </button>
    );
  }

  // 기타 경우
  return null;
};



    // 일반 사용자 메뉴
   const userMenu = [
  {
    id: 1,
    icon: "img/icon-1.png",
    title: "회원 정보 수정",
    description: "비밀번호/주소/연락처 수정/회원탈퇴",
    // ✅ 로컬(normal)만 비밀번호 인증 페이지로, 소셜은 바로 수정 페이지로
    link: provider === "normal" ? "/mypage/p_update" : "/mypage/p_update/edit",
  },
        {
            id: 2,
            icon: "img/icon-1.png",
            title: "관심상품",
            description: "장바구니 보기 / 찜 목록 보기",
            link: "#"
        },
        {
            id: 3,
            icon: "img/icon-1.png",
            title: "배송지 관리",
            description: "배송지 추가/수정/삭제",
            link: "/mypage/addrList"
        },
        {
            id: 4,
            icon: "img/icon-1.png",
            title: "나의 전체 구매내역/리뷰",
            description: "구매내역 조회/수정/삭제",
            link: "/mypage/orderlist"
        },
        {
            id: 5,
            icon: "img/icon-1.png",
            title: "나의 게시글",
            description: "나의 문의 내역 / 나의 커뮤니티 컨텐츠",
            link: "#"
        },

        {
            id: 7,
            icon: "img/icon-1.png",
            title: "마일리지",
            description: "충전하기/출금하기",
            link: "/mypage/mileage"
        }        
    ];


    // 주문취소
    const requestCancel = async (orderId) => {
    if (!window.confirm("정말 주문을 취소하시겠습니까?")) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:8080/api/orders/cancel-request/${orderId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            cancelReason: "사용자가 주문 취소"   // 필요하면 사유도 보낼 수 있음
        })
        });

        if (res.ok) {
        alert("주문취소 요청이 접수되었습니다.");
        seDalOrders(); // 새로고침
        } else {
        const errorText = await res.text();
        alert("주문 취소 실패: " + errorText);
        }
    } catch (err) {
        console.error("주문 취소 오류", err);
        alert("주문 취소 중 오류가 발생했습니다.");
    }
    };

    // 환불처리 함수
    const refund = async (orderId, orderStatus) => {

        if (orderStatus === "환불요청" || orderStatus === "환불완료") {
            alert("이미 환불이 진행 중이거나 완료된 주문입니다.");
            return;
        }

        // 1) 환불 사유 입력받기
        const reason = window.prompt("환불 사유를 입력해주세요 :", "");

        if (reason === null || reason.trim() === "") {
            alert("환불 사유를 입력해야 합니다.");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 2) 환불 요청 API 호출
            const response = await fetch(`${API_URL}/refund-request/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ refundReason: reason })  // 서버로 사유 전달
            });

            if (response.ok) {
                alert("환불 요청이 접수되었습니다.");
                seDalOrders(); // 리스트 새로고침
            } else {
                const errorMessage = await response.text();
                alert(`환불 요청 실패: ${errorMessage}`);
            }
        } catch (error) {
            console.error("환불 요청 오류:", error);
            alert("환불 요청 처리 중 오류가 발생했습니다.");
        }
    };

    // 환불취소 함수
    const cancelRefund = async (orderId) => {

        if (!window.confirm("환불 요청을 취소하시겠습니까?")) return;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/refund-cancel/${orderId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                alert("환불 요청이 취소되었습니다.");
                seDalOrders(); // 목록 새로고침
            } else {
                const msg = await response.text();
                alert("환불 요청 취소 실패: " + msg);
            }

        } catch (error) {
            console.error("환불 취소 오류:", error);
            alert("환불 요청 취소 중 오류가 발생했습니다.");
        }
    };

    //환불거절 사유
    const showRejectReason = (order) => {
    const reason = order.cancelRejectReason || order.refundRejectReason;

    alert(
        `요청이 거절되었습니다.\n\n사유: ${reason || "사유가 제공되지 않음"}`
    );
    };

    // 수령확인 처리
    const confirmReceive = async (orderId) => {
        if (!window.confirm("상품을 확인하셨나요? 수령확인 처리됩니다.")) return;

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`http://localhost:8080/api/orders/receive-complete/${orderId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
console.log("orderId =", orderId);
console.log("token =", token);
            if (response.ok) {
                alert("수령확인 완료되었습니다.");
                seDalOrders(); // 새로고침
            } else {
                const msg = await response.text();
                alert("수령확인 실패: " + msg);
            }

        } catch (error) {
            console.error("수령확인 오류:", error);
            alert("수령확인 처리 중 오류가 발생했습니다.");
        }
    };


    //등록 물품 삭제
    const handleDeleteProduct = async (productId) => {
        if(!window.confirm("정말로 상품을 삭제하시겠습니까?")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/seller/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if(res.ok) {
                alert("상품이 삭제되었습니다.");
                setMyProducts(prev => prev.filter(p => p.id !== productId));
            }else {
                const text = await res.text();
                alert("삭제 실패: " + text);
            }
        } catch (error) {
            console.error(error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    const getOrderAction = (order) => {

    // 환불거절
    if (order.refundRejected) {
        return {
            label: "환불불가",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => showRejectReason(order)
        };
    }

    // 취소거절
    if (order.cancelRejected) {
        return {
            label: "취소불가",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => showRejectReason(order)
        };
    }


    // 주문취소 가능한 상태
    if (["결제완료", "배송준비", "배송준비중"].includes(order.status)) {
        return {
            label: "주문취소",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => requestCancel(order.id)
        };
    }

    // 취소요청
    if (order.status === "취소요청") {
        return {
            label: "취소대기",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    // 취소완료
    if (order.status === "취소완료") {
        return {
            label: "취소완료",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    // 환불요청 중
    if (order.status === "환불요청") {
        return {
            label: "환불대기",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    // 거래완료
    if (order.status === "거래완료") {
        return {
            label: "환불신청",
            className: "btn btn-sm btn-outline-dark",
            disabled: false,
            onClick: () => refund(order.id, order.status)
        };
    }

    // 환불완료
    if (order.status === "환불완료") {
        return null;
    }

    // 배송완료, 배송중 
    return null;
};

    return (
        <div>
            {/* 헤더 */}
            <div className="container-fluid page-header wow fadeIn">
                <div className="container">
                    <h1 className="display-5 mb-3 mypage-title">{name}님의 마이페이지</h1>
                    <span className="mypage-subtitle">마이페이지에서 다양한 서비스를 이용하실 수 있습니다.</span>

                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/">홈페이지</a>
                            </li>
                            <li className="breadcrumb-item text-dark active">
                                마이페이지
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container py-6">

                {/* 일반 회원 메뉴 (모든 사용자) */}               
                    <div className="row g-4 mb-5">
                        <div className="col-12 mb-4 text-center">
                            {renderSellerButton()}
                        </div>
                        {userMenu.map((item) => (
                            <div className="col-lg-4 col-md-6" key={item.id}>
                                <Link
                                    to={item.link}
                                    className="text-decoration-none"
                                >
                                    <div className="d-flex bg-light p-4 rounded shadow-sm align-items-start h-100">
                                        <img
                                            src={item.icon}
                                            style={{
                                                width: "60px",
                                                marginRight: "15px"
                                            }}
                                        />
                                        <div className="flex-grow-1 text-center">

                                            <h5 className="mb-2" >
                                                {item.title}
                                            </h5>
                                            <p className="mb-0 text-muted small">
                                            {item.title === "관심상품" ? (
                                                <>
                                                {/* 장바구니 */}
                                                <span
                                                    style={{ cursor: "pointer", transition: "0.15s" }}
                                                    onMouseEnter={(e) => {
                                                    e.target.style.color = "#28a745";   
                                                    e.target.style.textDecoration = "underline";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                    e.target.style.color = "";          
                                                    e.target.style.textDecoration = "none";
                                                    }}
                                                    onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = "/mypage/cart";
                                                    }}
                                                >
                                                    장바구니 보기
                                                </span>

                                                {" / "}

                                                {/* 위시리스트 목록 */}
                                                <span
                                                    style={{ cursor: "pointer", transition: "0.15s" }}
                                                    onMouseEnter={(e) => {
                                                    e.target.style.color = "#28a745";
                                                    e.target.style.textDecoration = "underline";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                    e.target.style.color = "";
                                                    e.target.style.textDecoration = "none";
                                                    }}
                                                    onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = "/wishlist";
                                                    }}
                                                >
                                                    찜 목록 보기
                                                </span>
                                                </>

                                            ) : item.title === "나의 게시글" ? (
                                                <>
                                                {/* 문의내역 */}
                                                <span
                                                    style={{ cursor: "pointer", transition: "0.15s" }}
                                                    onMouseEnter={(e) => {
                                                    e.target.style.color = "#28a745";   
                                                    e.target.style.textDecoration = "underline";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                    e.target.style.color = "";          
                                                    e.target.style.textDecoration = "none";
                                                    }}
                                                    onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = "/mypage/myqna";
                                                    }}
                                                >
                                                    나의 문의 내역
                                                </span>

                                                {" / "}

                                                {/* 위시리스트 목록 */}
                                                <span
                                                    style={{ cursor: "pointer", transition: "0.15s" }}
                                                    onMouseEnter={(e) => {
                                                    e.target.style.color = "#28a745";
                                                    e.target.style.textDecoration = "underline";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                    e.target.style.color = "";
                                                    e.target.style.textDecoration = "none";
                                                    }}
                                                    onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = "mypage/myposts";
                                                    }}
                                                >
                                                     나의 커뮤니티 컨텐츠
                                                </span>
                                                </>
                                            ) : (
                                                item.description
                                            )}
                                            </p>

                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                        {/* 최근 구매내역 */}
                        <hr className="mt-4 mb-4" />
                        <div className="mypage-recent-orders-section">
                            <div className="mb-4">
                                {/* 제목과 통계 정보 */}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="mb-0">최근 3개월 구매내역</h3>
                                    {!loading && recentOrders.length > 0 && (
                                        <div className="text-muted">
                                            <span className="me-3">총 <strong className="text-primary">{recentOrders.length}</strong>건</span>
                                            <span>총 결제금액: <strong className="text-danger">
                                                {recentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString()}원
                                            </strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {loading && (
                                <div className="text-center py-5">
                                    <div
                                        className="spinner-border text-primary"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            로딩 중...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!loading && recentOrders.length === 0 && (
                                <div className="alert alert-info text-center py-5">
                                    <i className="fa fa-shopping-cart fa-3x mb-3 d-block text-muted"></i>
                                    <p className="mb-0">최근 3개월 구매내역이 없습니다.</p>
                                </div>
                            )}

                            {!loading && recentOrders.length > 0 && (
                                <div>
                                <div className="row bg-light py-3 mb-2 rounded fw-bold text-center align-items-center mypage-orders-header">
                                <div className="col-1">NO</div>

                        {/* 추가내용 */}
                                <div className="col-2">주문번호</div>
                                <div className="col-1">결제상태</div>
                                <div className="col-2">구매날짜</div>
                                <div className="col-2">상품명</div>
                                <div className="col-1">수량</div>
                                <div className="col-1">단가</div>
                                <div className="col-1">총결제금액</div>
                                <div className="col-1">환불</div>
                            </div>

                {/* ********주문목록******************* */}
                <div className="row g-2">
                {(() => {
                    const totalPages = Math.ceil(recentOrders.length / recentOrdersItemsPerPage);
                    const indexOfLast = recentOrdersCurrentPage * recentOrdersItemsPerPage;
                    const indexOfFirst = indexOfLast - recentOrdersItemsPerPage;
                    const currentRecentOrders = recentOrders.slice(indexOfFirst, indexOfLast);
                    
                    // 5개씩 묶어서 표시 (1~5, 6~10, 11~15 ...)
                    const pageGroupSize = 5;
                    const currentGroup = Math.floor((recentOrdersCurrentPage - 1) / pageGroupSize);
                    const startPage = currentGroup * pageGroupSize + 1;
                    const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
                    
                    const pageNumbers = [];
                    for(let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(i);
                    }

                    return (
                        <>
                        {currentRecentOrders.map((order, index) => {

                    const productName = order.pname || productNames[order.productId] || order.productName || '상품명 없음';

                    // 환불 여부에 따라 상태 변경
                    const isRefun = order.status === "환불완료";
                    const rowStyle = {
                        textDecoration: isRefun ? 'line-through' : 'none',
                        color: isRefun ? '#999' : '#333', 
                        fontSize: '13px'
                    };
                        return (
                    <div className="col-12" key={order.id}>
                        <div className="row bg-white py-3 rounded fw-bold text-center shadow-sm align-items-center" style={rowStyle}>

                        {/* no */}
                        <div className="col-1">
                            {indexOfFirst + index + 1}
                        </div>

                        {/* 주문번호 */}
                        <div className="col-2">
                            {order.id || 'N/A'}
                        </div>
                                        
                        {/* 결제 상태 */}
                        {/* 결제 상태 + 수령확인 버튼 */}
    <div className="col-1 d-flex flex-column align-items-center">

    {/* 상태 텍스트(결제완료 / 배송준비중 / 배송중 / 배송완료) */}
    {order.status}

    {/* 배송완료 + 아직 인수 미확인일 때만 버튼 표시 */}
    {order.status === "배송완료" && order.receiveStatus !== "인수완료" && (
        <button
            className="btn btn-sm btn-success mt-1"
            style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
            }}
            onClick={() => confirmReceive(order.id)}
        >
            수령확인
        </button>
    )}

    {/* 배송완료 + 인수완료일 때 표시 */}
    {order.status === "배송완료" && order.receiveStatus === "인수완료" && (
        <span className="text-success small mt-1">인수완료</span>
    )}
</div>

                        {/* 구매날짜 */}
                        <div className="col-2">
                            {formatDate(order.orderDate)}
                        </div>

                        {/* 상품명 */}
                        <div className="col-2">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <strong>{order.pname}</strong>
                                {/* 단위 옵션 정보 표시 - selectedUnitProductName이 있을 때만 표시 (단위 옵션 선택한 상품만) */}
                                {order.selectedUnitProductName && order.selectedUnitProductName.trim() && (
                                    <span style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                        {order.selectedUnitProductName.trim()}
                                        {order.selectedUnit && order.selectedUnit.trim() ? ` - ${order.selectedUnit.trim()}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 수량 */}
                        <div className="col-1">
                            {order.qty || 0}개
                        </div>

                        {/* 단가 */}
                        <div className="col-1"
                        >
                            {(order.price || 0).toLocaleString()}원
                        </div>

                        {/* 총 결제금액 */}
                        <div className="col-1 text-danger">
                                {(order.totalPrice || 0).toLocaleString()}원
                        </div>


                        {/* 환불 / 취소 상태 버튼 구역 */}
                        <div className="col-1">
                        {(() => {
                            const action = getOrderAction(order);
                            if (!action) return null;

      return (
          <button
              className={action.className}

                style={{
        padding: "5px 5px",
       }}
              disabled={action.disabled}
              onClick={action.onClick}
          >
              {action.label}
          </button>
      );
  })()}
</div>



                                    </div>
                                </div>
                                );
                            })}
                            
                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <nav className="mt-4">
                                    <ul className="pagination justify-content-center">
                                        {/* 이전 버튼 */}
                                        <li className={`page-item ${recentOrdersCurrentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => setRecentOrdersCurrentPage(recentOrdersCurrentPage - 1)}
                                                disabled={recentOrdersCurrentPage === 1}
                                            >
                                                이전
                                            </button>
                                        </li>

                                        {/* 페이지 번호 버튼들 */}
                                        {pageNumbers.map(number => (
                                            <li key={number} className={`page-item ${recentOrdersCurrentPage === number ? 'active' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => setRecentOrdersCurrentPage(number)}
                                                >
                                                    {number}
                                                </button>
                                            </li>
                                        ))}

                                        {/* 다음 버튼 */}
                                        <li className={`page-item ${recentOrdersCurrentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => setRecentOrdersCurrentPage(recentOrdersCurrentPage + 1)}
                                                disabled={recentOrdersCurrentPage === totalPages}
                                            >
                                                다음
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    );
                })()}
                        </div>
                    </div>
                )}
                        {!loading && (
                            <div className="text-center mt-4">
                                <Link
                                    to="/mypage/orderlist"
                                    className="btn btn-primary btn-lg" >
                                    전체 구매내역 보기
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
