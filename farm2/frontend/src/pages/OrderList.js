import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GotoBack from "../components/GotoBack";
import MyReview from "../components/MyReview";
import ReviewForm from "../components/ReviewForm";


const OrderList = () => {

// 오더리스트에 리뷰남기기 기능 추가 11/27 혜정
const [myReviews, setMyReviews] = useState([]);
const [writeReviewId, setWriteReviewId] = useState(null); //리뷰남기기 클릭한 주문id
const [editReviewId, setEditReviewId] = useState(null); 
//수정중인 리뷰id
const [reviewContent, setReviewContent ] = useState(""); //내용

const [orders, setOrders] = useState([]);
const [userId, setUserId] = useState('');
const [pName, setPname] = useState('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [loading, setLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [productNames, setProductNames] = useState({}); // productId -> productName 매핑
const itemsPerPage = 10;


const API_URL = 'http://localhost:8080/api/orders';

// 상품 정보 가져오기
const fetchProductName = async (productId) => {
    if (!productId) return null;
    // 이미 가져온 경우 캐시된 값 반환
    if (productNames[productId]) return productNames[productId];
    try {
        const response = await fetch(`http://localhost:8080/products/detail/${productId}`);
        if (response.ok) {
            const product = await response.json();
            if (product && product.name) {
                // state 업데이트
                setProductNames(prev => {
                    const updated = { ...prev, [productId]: product.name };
                    return updated;
                });
                return product.name;
            }
        }
    } catch (error) {
        console.error(`상품 정보 조회 실패 (productId: ${productId}):`, error);
    }
    return null;
};

// 전체조회
const fetchAllOrders = async () => {
    
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}?userId=${userId}`);
        const data = await response.json();

        console.log("구매내역 데이터:", data);

        const sortedData = data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        setOrders(sortedData);
        
        // pName이 없는 경우 productId 가져오기
        const productIds = sortedData
            .filter(order => order.productId && (!order.pname || order.pname === '상품명 없음' || order.pname.trim() === ''))
            .map(order => order.productId);
        
        // 중복 제거
        const uniqueProductIds = [...new Set(productIds)];
        
        // 병렬로 상품 정보 가져오기
        const productPromises = uniqueProductIds.map(productId => fetchProductName(productId));
        await Promise.all(productPromises);
        
        // pName이 없는 주문에 대해 상품명 업데이트
        sortedData.forEach(order => {
            if (order.productId && (!order.pname || order.pname === '상품명 없음' || order.pname.trim() === '')) {
                const fetchedName = productNames[order.productId];
                if (fetchedName) {
                    order.pname = fetchedName;
                }
            }
        });
        
        setCurrentPage(1);
    } catch (error) {
        console.error("구매내역 조회 오류:", error);
        setOrders([]);
    }
    setLoading(false);
};

// 통합검색
const totalSearch = async () => {
    if(pName.trim() === '' && startDate === '' && endDate === '') {
        alert('검색 조건을 입력하세요');
        return;
    }
    setLoading(true);
    try {
        let searchUrl = '';
        if(pName.trim() !== '' && startDate === '' && endDate === '') {
            searchUrl = `${API_URL}/kSearch?userId=${userId}&pName=${pName}`;
        } else if (pName.trim() === '' && startDate !== '' && endDate !== '') {
            const startDateTime = startDate + 'T00:00:00';
            const endDateTime = endDate + 'T23:59:59';
            searchUrl = `${API_URL}/period?userId=${userId}&startDate=${startDateTime}&endDate=${endDateTime}`;
        } else if (pName.trim() !== '' && startDate !== '' && endDate !== '') {
            const startDateTime = startDate + 'T00:00:00';
            const endDateTime = endDate + 'T23:59:59';
            searchUrl = `${API_URL}/tSearch?userId=${userId}&pName=${pName}&startDate=${startDateTime}&endDate=${endDateTime}`;
        } else {
            alert('시작, 종료일 모두 입력해주세요.');
            setLoading(false);
            return;
        }


        console.log(searchUrl);
        const response = await fetch(searchUrl);
        const data = await response.json();
        const sortedData = Array.isArray(data) && data.length > 0
            ? data.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate))
            : [];
        setOrders(sortedData);
        setCurrentPage(1);
    } catch (error) {
        console.error(error);
        setOrders([]);
    }
    setLoading(false);
};


//주문취소 기능 추가 12/1
const requestCancel = async (orderId) => {
    if (!window.confirm("주문을 취소하시겠습니까?")) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:8080/api/orders/cancel-request/${orderId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cancelReason: "주문 취소"
            })
        });

        if (res.ok) {
            alert("주문취소 요청이 접수되었습니다.");
            fetchAllOrders(); //새로고침
        } else {
            const errorText = await res.text();
            alert("주문 취소 실패: "+ errorText);
        }
    } catch (err) {
        console.error("주문 취소 오류", err);
        alert("주문취소 중 오류가 발생했습니다.");
    }
};



// 환불 처리 함수 추가 11/25
const refund = async (orderId, orderStatus) => {

    if (orderStatus === "환불완료" || orderStatus === "환불완료") {
        alert("이미 환불접수된 주문입니다.")
        return;
    }

    //사용자에게 환불 사유 입력받는것 추가 12/1
    // if (!window.confirm("환불 하시겠습니까?")) {
    const reason = window.prompt("환불 사유를 입력해주세요:", "");

    if (reason === null || reason.trim() === "") {
        alert("환불 사유를 입력해주세요.");
    
        return;
    }

    try {
        // 12/5추가
        const token = localStorage.getItem("token");

        // 환불 요청
        const response = await fetch(`${API_URL}/refund-request/${orderId}`,{
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({refundReason: reason })
        });

        if (response.ok) {
            // alert("환불이 완료되었습니다.");
            alert("환불 요청이 접수 되었습니다.");

            fetchAllOrders();
        } else {
            const errorMessage = await response.text();
            alert(`환불 실패: ${errorMessage}`);
        }
    } catch (error) {
        console.error("환불 처리 오류:", error);
        alert("환불 처리 중 오류가 발생했습니다.");        
    }
};

// 환불 취소 기능 추가 11/25 
const cancelRefund = async (orderId) => {
    if (!window.confirm("환불요청을 취소하시겠습니까?")) return;
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
            fetchAllOrders();
        } else {
            const msg = await response.text();
            alert("환불 요청 취소 실패: " + msg);
        }
        
    } catch (error) {
        console.error("환불 취소 오류:", error);
        alert("환불 요청 취소 중 오류가 발생했습니다.");
        
    }
};

//환불/취소 거절 사유 표시
const showRejectReason = (order) => {
    const reason = order.cancelRejectReason || order.refundRejectReason;
    alert(`요청이 거절 되었습니다. \n\n사유: ${reason || "사유가 제공되지 않음"}`);
};

// 수령확인 기능 추가
const confirmReceive = async (orderId) => {
    if (!window.confirm("상품을 인수하셨나요? 인수확인 처리됩니다.")) return;

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:8080/api/orders/receive-complete/${orderId}`, {

            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            alert("상품 수령확인 처리되었습니다.");
            fetchAllOrders();
        } else {
            const msg = await response.text();
            alert("인수 확인 실패: " + msg);
        }
        
    } catch (error) {
        console.error("인수확인 오류: ", error);
        alert("인수확인 처리 중 오류가 발생했습니다.");
    }
};

// 주문상태별 버튼 보여주는것
const getOrderAction = (order) => {

    //환불거절 시
    if (order.refundRejected) {
        return{
            label: "환불불가",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => showRejectReason(order)
        };
    }

    if (order.cancelRejected) {
        return {
            label: "취소 불가",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => showRejectReason(order)
        };
    }

    if (["결제완료", "배송준비", "배송준비중"].includes(order.status)) {
        return {
            label: "주문취소",
            className: "btn btn-sm btn-danger",
            disabled: false,
            onClick: () => requestCancel(order.id)
        };
    }

    // 취소 요청중
    if (order.status === "취소요청") {
        return {
            label: "취소요청",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    //취소 완료 상태
    if (order.status === "취소완료") {
        return {
            label: "취소완료",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    //환불요청
    if (order.status === "환불요청") {
        return {
            label: "환불요청",
            className: "btn btn-sm btn-dark",
            disabled: true
        };
    }

    //거래완료-환불신청 가능
    if (order.status === "거래완료") {
        return {
            label: "환불신청",
            className: "btn btn-sm btn-outline-dark",
            disabled: false,
            onClick: () => refund(order.id, order.status)
        };
    }

    //환불완료 상태
    if (order.status === "환불완료") {
        return null;
    }
    return null;
};





//-------------환불 코딩 추가 11/25 

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};

// 로그인 체크 & userId 세팅
useEffect(() => {
    const loginUserId = localStorage.getItem('userId');
    if (loginUserId) {
        setUserId(loginUserId);
    } else {
        alert('로그인이 필요한 서비스입니다.');
        const currentPath = window.location.pathname;
        window.location.replace('/login?redirect=' + encodeURIComponent(currentPath));
    }
}, []);

// userId 세팅 후 전체조회
useEffect(() => {
    if(userId) fetchAllOrders();
}, [userId]);

//나의 리뷰목록 가져오기  11/27혜정
useEffect(() => {
    if (!userId) return;

    const fetchMyReviews = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/myreview/${userId}`);

            const data = await res.json();
            setMyReviews(data);
        } catch (error) {
            console.error("내 리뷰 조회 오류: ", error)            
        }
    };
    fetchMyReviews();
}, [userId]);

const totalPages = Math.ceil(orders.length / itemsPerPage);

const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;
const currentOrders = orders.slice(indexOfFirst, indexOfLast);

const pageNumbers = [];
for(let i = 1; i <= totalPages; i++) pageNumbers.push(i);

return (

    <div>
          <div className="container-fluid page-header">
            <div className="container">
                <h1 className="display-3 mb-3">구매내역</h1>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><a href="/">홈페이지</a></li>
                        <li className="breadcrumb-item"><a href="/userpage">마이페이지</a></li>
                        <li className="breadcrumb-item text-dark active">구매내역</li>
                    </ol>
                </nav>
            </div>
        </div>

        <div className="container">
            <hr style={{ border: 'none', borderTop: '2px solid #dee2e6', margin: '50px 0' }}/>

            <div className="row align-items-end mb-5">
                <div className="col-md-3"><h2 className="display-8 mb-0">나의 구매리스트</h2></div>
                <div className="col-md-9">
                    <div className="row g-2">
                        <div className="col-md-3">
                            <label className="form-label small">시작일</label>
                            <input type="date" className="form-control" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small">종료일</label>
                            <input type="date" className="form-control" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small">상품명</label>
                            <input type="text" className="form-control" placeholder="상품명 검색" value={pName} onChange={(e)=>setPname(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small">&nbsp;</label>
                            <button className="btn btn-success w-100" onClick={totalSearch} disabled={loading}>검색</button>
                        </div>
                    </div>
                </div>
            </div>
<br></br><br></br><br></br>
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="mb-0">구매내역 목록</h3>
                    <div className="text-muted">
                        <span className="me-3">총 <strong className="text-primary">{orders.length}</strong>건</span>
                        {orders.length > 0 && (
                            <span>총 결제금액: <strong className="text-danger">
                                {orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString()}원
                            </strong></span>
                        )}
                    </div>
                </div>
                {!loading && orders.length === 0 && (
                    <div className="alert alert-info text-center py-5">
                        <i className="fa fa-shopping-cart fa-3x mb-3 d-block text-muted"></i>
                        <p className="mb-0">구매내역이 없습니다</p>
                    </div>
                )}
                {!loading && currentOrders.length > 0 && (
                    <div>
                        <div>
                            <div className="row bg-light py-3 mb-2 rounded fw-bold text-center align-items-center" style={{ fontSize: '14px' }}>
                                <div className="col-1">NO</div>
                                <div className="col-2">주문번호</div>
                                <div className="col-1">결제상태</div>
                                <div className="col-2">구매날짜</div>
                                <div className="col-1">상품명</div>
                                <div className="col-1">수량</div>
                                <div className="col-1">단가</div>
                                <div className="col-1">총결제금액</div>
                                <div className="col-1">리뷰</div>
                                <div className="col-1">주문관리</div>
                            </div>

                            {/* 주문목록 */}
                            <div className="row g-2">
                                {currentOrders.map((order, index) => {

                                    // 환불 여부에 따라 상태 변경
                                    const isRefund = order.status === "환불완료";
                                    const rowStyle = {
                                        textDecoration: isRefund ? 'line-through' : 'none',
                                        color: isRefund ? '#999' : '#333',
                                        fontSize: '13px'
                                };

                                // 이 주문(orderId)에 내가쓴 리뷰작성건있는지 확인
                   //             const myReview = myReviews.find(r => r.orderId === order.id)
//========================================== 여기까지 11/27 혜정 추가

                                const canReview = !isRefund && (order.status === '배송완료' || order.status === '거래완료');
                     //           const canReview = !isRefun && order.status === '배송완료';
                                // 리뷰작성가능 여부 판단

                                return (
                                    <div className="col-12" key={order.id}>
                                        <div className="row bg-white p-3 rounded shadow-sm align-items-center text-center" style={rowStyle}>

                                            {/* no */}
                                            <div className="col-1">
                                                <strong>{indexOfFirst + index + 1}</strong>
                                            </div>

                                            {/* 주문번호 */}
                                            <div className="col-2">
                                                <strong>{order.id}</strong>
                                            </div>
                                            
                                            {/* 결제 상태 */}
                                            <div className="col-1 d-flex flex-column align-items-center">
                                                <strong>{order.status}</strong>
                                                {/* 배송상태 */}
                                                {order.status === "배송완료" && order.receiveStatus !== "인수완료" && (
                                                    <button className="btn btn-sm btn-success mt-1"
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "3px 8px",
                                                            borderRadius: "4px",
                                                        }}
                                                        onClick={() => confirmReceive(order.id)}>
                                                        <strong>수령확인</strong>
                                                    </button>
                                                )}
                                                {order.status === "배송완료" && order.receiveStatus === "인수완료" && (
                                                    <span className="text-success small mt-1">인수완료</span>
                                                )}
                                            </div>

                                            {/* 구매날짜 */}
                                            <div className="col-2">
                                                <strong>{formatDate(order.orderDate)}</strong>
                                            </div>

                                            {/* 상품명 */}
                                            <div className="col-1">
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <strong
                                                    style={{ 
                                                    cursor: 'pointer',
                                                    color: '#333',
                                                    textDecoration: 'none'
                                                }}
                                                onClick={async () => {
                                                   if (!order.productId) {
                                                    alert("현재 판매하지 않는 상품입니다.");
                                                    return;
                                                   }
                                                   try {
                                                    const res = await fetch(`http://localhost:8080/products/detail/${order.productId}`);

                                                    if (!res.ok) {
                                                        alert("현재판매하지 않는 상품입니다.");
                                                        return;
                                                    }

                                                    window.location.href = `/products/detail/${order.productId}`;
                                                   } catch (error) {
                                                    alert("현재 판매하지 않는 상품입니다.");
                                                    
                                                //         window.location.href = `/products/detail/${order.productId}`;
                                                     }
                                                 }}
                                                onMouseEnter={(e) => {
                                                    //마우스 올리면 색상변함
                                                    
                                                    e.target.style.color = '#28a745';
                                                    e.target.style.textDecoration = 'underline';      
                                                }}

                                                onMouseLeave={(e) => {
                                                    //마우스 떼면 원래대로

                                                    e.target.style.color = '#333';
                                                    e.target.style.textDecoration = 'none';
                                                }}
                                                > {order.pname}</strong>
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
                                                <strong>{order.qty || 0}개</strong>
                                            </div>

                                            {/* 단가 */}
                                            <div className="col-1">
                                                <strong>{(order.price || 0).toLocaleString()}원</strong>
                                            </div>

                                            {/* 총 결제금액 */}
                                            <div className="col-1 text-danger">
                                                <strong>
                                                    {(order.totalPrice || 0).toLocaleString()}원
                                                </strong>
                                            </div>

{/* ========리뷰버튼 추가============ */}
<div className="col-1">
    <MyReview
    order={order}
    myReviews={myReviews}
    setMyReviews={setMyReviews}
    reviewContent={reviewContent}
    setReviewContent={setReviewContent}
    writeReviewId={writeReviewId}
    setWriteReviewId={setWriteReviewId}
    editReviewId={editReviewId}
    setEditReviewId={setEditReviewId}
    userId={userId}/>
</div>

{/* 주문관리 버튼영역 주문취소,환불,거절사유 12/1추가 */}
<div className="col-1">
    {(() => {
        const action = getOrderAction(order);

        // 버튼이 없으면 아무것도 표시하지마
        if(!action) return null;

        return (
            <button
                className={action.className}
                style={{
                     fontSize: "11.5px", padding: "5px 8px", width: "65px"}}
                disabled={action.disabled}
                onClick={action.onClick}
            >
                <strong>{action.label}</strong>
            </button>
        );
    })()}
</div>

                                        </div>

                                        {/* 리뷰폼 렌더링 */}
                                        {writeReviewId === order.id && (
                                            <div className="col-12 mt-2">
                                                <ReviewForm
                                                    mode="write"
                                                    order={order}
                                                    existingReview={null}
                                                    userId={userId}
                                                    reviewContent={reviewContent}
                                                    setReviewContent={setReviewContent}
                                                    writeReviewId={writeReviewId}
                                                    setWriteReviewId={setWriteReviewId}
                                                    editReviewId={editReviewId}
                                                    setEditReviewId={setEditReviewId}
                                                    myReviews={myReviews}
                                                    setMyReviews={setMyReviews}
                                                />
                                            </div>
                                        )}

                                        {editReviewId &&
                                            myReviews.find(r => r.orderId === order.id)?.id === editReviewId && (
                                                <div className="col-12 mt-2">
                                                    <ReviewForm
                                                        mode="edit"
                                                        order={order}
                                                        existingReview={myReviews.find(r => r.id === editReviewId)}
                                                        userId={userId}
                                                        reviewContent={reviewContent}
                                                        setReviewContent={setReviewContent}
                                                        writeReviewId={writeReviewId}
                                                        setWriteReviewId={setWriteReviewId}
                                                        editReviewId={editReviewId}
                                                        setEditReviewId={setEditReviewId}
                                                        myReviews={myReviews}
                                                        setMyReviews={setMyReviews}
                                                    />
                                                </div>
                                            )}
                                    </div>
                                );
                            })}
                            </div>
                        </div>
   
  {/* 페이지네이션 추가 */}
                        {totalPages > 1 && (
                            <nav className="mt-4">
                                <ul className="pagination justify-content-center">
                                    {/* 이전 버튼 */}
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            이전
                                        </button>
                                    </li>

                                    {/* 페이지 번호 버튼들 */}
                                    {pageNumbers.map(number => (
                                        <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => setCurrentPage(number)}
                                            >
                                                {number}
                                            </button>
                                        </li>
                                    ))}

                                    {/* 다음 버튼 */}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            다음
                                        </button>
                                        
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                    )}
                </div>
            </div>
            <br></br><br></br><br></br><br></br><br></br><br></br>
            <GotoBack />
        </div>
    );
};

export default OrderList;
