import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import '../styles/mileage.css';
import GotoBack from "../components/GotoBack";


const Mileage = () => {

    const userId = localStorage.getItem("userId") || "guest";
    const name = localStorage.getItem("username") || "guest";
    const role = localStorage.getItem("role") || "ROLE_USER";
    const token = localStorage.getItem("token");
    const location = useLocation();

    const [activeTab, setActiveTab] = useState("user");
    const [activeMenu, setActiveMenu] = useState('history');
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [chargeAmount, setChargeAmount] = useState('');
    const [chargeAmountType, setChargeAmountType] = useState('select'); 
    const [customerKey, setCustomerKey] = useState('');
    const [tossWidgets, setTossWidgets] = useState(null);
    const [showPaymentWidget, setShowPaymentWidget] = useState(false);
    const [agreementChecked, setAgreementChecked] = useState(false);
    const navigate = useNavigate();
    const paymentMethodRef = useRef(null);
    const agreementRef = useRef(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAccount, setWithdrawAccount] = useState('');
    const [bankName, setBankName] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [withdrawRequests, setWithdrawRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [historyTab, setHistoryTab] = useState('transactions'); // 'transactions' 또는 'withdraw'

    // 마일리지 잔액 조회 및 customerKey 가져오기
    useEffect(() => {
        if (userId && userId !== "guest" && token) {
            fetchBalance();
            fetchHistory();
            fetchCustomerKey();
            fetchWithdrawRequests();
        }
    }, [userId, token]);

    // URL 파라미터로 메뉴 설정 (navbar에서 이동 시)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const menu = params.get('menu');
        if (menu === 'charge' || menu === 'withdraw' || menu === 'history') {
            setActiveMenu(menu);
        } else {
            setActiveMenu('history');
        }
    }, [location.search]);

    // 모달이 열릴 때 위젯 렌더링
    useEffect(() => {
        if (showPaymentWidget && tossWidgets && chargeAmount) {
            let isMounted = true;
            let rendered = false;
            let retryCount = 0;
            const maxRetries = 10;

            const renderWidgets = async () => {
                if (rendered) return;
                
                try {
                    // DOM 요소 찾기 (재시도 로직 포함)
                    let paymentMethodEl = document.getElementById('payment-method');
                    let agreementEl = document.getElementById('agreement');
                    
                    // 요소를 찾을 때까지 재시도
                    while ((!paymentMethodEl || !agreementEl) && retryCount < maxRetries && isMounted) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        paymentMethodEl = document.getElementById('payment-method');
                        agreementEl = document.getElementById('agreement');
                        retryCount++;
                    }
                    
                    if (!paymentMethodEl || !agreementEl) {
                        console.error('위젯 컨테이너를 찾을 수 없습니다.');
                        if (isMounted) {
                            alert('결제 위젯을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                            handleCloseModal();
                        }
                        return;
                    }
                    
                    rendered = true;
                    
                    // 기존 위젯 제거
                    paymentMethodEl.innerHTML = '';
                    agreementEl.innerHTML = '';
                    
                    // 모든 자식 요소 제거
                    while (paymentMethodEl.firstChild) {
                        paymentMethodEl.removeChild(paymentMethodEl.firstChild);
                    }
                    while (agreementEl.firstChild) {
                        agreementEl.removeChild(agreementEl.firstChild);
                    }
                    
                    // 약간의 지연 후 위젯 렌더링 (DOM이 완전히 정리된 후)
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    if (!isMounted) return;
                    
                    console.log('위젯 렌더링 시작...');
                    console.log('paymentMethodEl:', paymentMethodEl);
                    console.log('agreementEl:', agreementEl);
                    
                    // 위젯 렌더링
                    await tossWidgets.renderPaymentMethods({
                        selector: '#payment-method',
                        variantKey: 'DEFAULT'
                    });
                    
                    console.log('결제 수단 위젯 렌더링 완료');
                    console.log('paymentMethodEl children:', paymentMethodEl.children.length);
                    console.log('paymentMethodEl innerHTML:', paymentMethodEl.innerHTML.substring(0, 200));
                    
                    await tossWidgets.renderAgreement({
                        selector: '#agreement',
                        variantKey: 'AGREEMENT'
                    });
                    
                    console.log('약관 동의 위젯 렌더링 완료');
                    console.log('agreementEl children:', agreementEl.children.length);
                    console.log('agreementEl innerHTML:', agreementEl.innerHTML.substring(0, 200));
                    
                    // 체크박스 상태 모니터링
                    const checkAgreementStatus = () => {
                        const checkbox = agreementEl.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            setAgreementChecked(checkbox.checked);
                        }
                    };
                    
                    // 초기 상태 확인
                    setTimeout(checkAgreementStatus, 200);
                    
                    // 체크박스 변경 이벤트 리스너 추가
                    agreementEl.addEventListener('change', (e) => {
                        if (e.target.type === 'checkbox') {
                            setAgreementChecked(e.target.checked);
                        }
                    });
                    
                    // MutationObserver로 동적 생성된 체크박스 감지
                    const observer = new MutationObserver(() => {
                        checkAgreementStatus();
                    });
                    
                    observer.observe(agreementEl, {
                        childList: true,
                        subtree: true
                    });
                } catch (error) {
                    console.error('위젯 렌더링 실패:', error);
                    rendered = false;
                    if (isMounted) {
                        alert('결제 위젯 렌더링 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
                        handleCloseModal();
                    }
                }
            };

            // DOM이 준비될 때까지 약간의 지연
            const timer = setTimeout(() => {
                renderWidgets();
            }, 800);

            return () => {
                isMounted = false;
                rendered = false;
                clearTimeout(timer);
                // cleanup: 위젯 제거
                const paymentMethodEl = document.getElementById('payment-method');
                const agreementEl = document.getElementById('agreement');
                if (paymentMethodEl) {
                    paymentMethodEl.innerHTML = '';
                }
                if (agreementEl) {
                    agreementEl.innerHTML = '';
                }
            };
        }
    }, [showPaymentWidget, tossWidgets, chargeAmount]);

    // customerKey 조회
    const fetchCustomerKey = async () => {
        if (!token || userId === "guest") {
            return null;
        }
        try {
            const response = await api.get('/api/toss-payment/customer-key', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const key = response.data.customerKey;
            setCustomerKey(key);
            return key;
        } catch (error) {
            // 401 오류는 조용히 처리 (로그인하지 않은 사용자)
            if (error.response?.status === 401) {
                console.log('인증이 필요합니다. 로그인 후 이용해주세요.');
            } else {
                console.error('customerKey 조회 실패:', error);
            }
            return null;
        }
    };


    const fetchBalance = async () => {
        if (!token || userId === "guest") {
            return;
        }
        try {
            const response = await api.get('/api/mileage/balance', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setBalance(response.data.balance || 0);
        } catch (error) {
            // 401 오류는 조용히 처리 (로그인하지 않은 사용자)
            if (error.response?.status === 401) {
                console.log('인증이 필요합니다. 로그인 후 이용해주세요.');
            } else {
                console.error('마일리지 조회 실패:', error);
            }
        }
    };

    const fetchHistory = async () => {
        if (!token || userId === "guest") {
            return;
        }
        try {
            const response = await api.get('/api/mileage/history', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setTransactions(response.data.transactions || []);
        } catch (error) {
            // 401 오류는 조용히 처리 (로그인하지 않은 사용자)
            if (error.response?.status === 401) {
                console.log('인증이 필요합니다. 로그인 후 이용해주세요.');
            } else {
                console.error('거래 내역 조회 실패:', error);
            }
        }
    };

    const fetchWithdrawRequests = async () => {
        if (!token || userId === "guest") {
            return;
        }
        try {
            const response = await api.get('/api/withdraw/my-requests', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setWithdrawRequests(response.data.requests || []);
        } catch (error) {
            // 401 오류는 조용히 처리 (로그인하지 않은 사용자)
            if (error.response?.status === 401) {
                console.log('인증이 필요합니다. 로그인 후 이용해주세요.');
            } else {
                console.error('출금 신청 목록 조회 실패:', error);
            }
        }
    };

    const handleCharge = async () => {
        if (!chargeAmount || parseInt(chargeAmount) <= 0) {
            alert('충전할 금액을 입력해주세요.');
            return;
        }

        const amount = parseInt(chargeAmount);
        if (amount < 1000) {
            alert('최소 충전 금액은 1,000원입니다.');
            return;
        }

        if (!token || userId === "guest") {
            alert('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
            return;
        }

        // customerKey 확인 및 가져오기
        let currentCustomerKey = customerKey;
        if (!currentCustomerKey) {
            try {
                const response = await api.get('/api/toss-payment/customer-key', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                currentCustomerKey = response.data.customerKey;
                setCustomerKey(currentCustomerKey);
            } catch (error) {
                if (error.response?.status === 401) {
                    alert('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
                    return;
                }
                alert('고객 정보를 불러오는 중 오류가 발생했습니다.');
                return;
            }
        }

        // 위젯 초기화 및 표시
        try {
            const tossPayments = await loadTossPayments('test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm');
            const widgets = tossPayments.widgets({ customerKey: currentCustomerKey });
            setTossWidgets(widgets);
            
            // 금액 설정
            await widgets.setAmount({
                currency: 'KRW',
                value: amount
            });
            
            // 결제 위젯 표시
            setShowPaymentWidget(true);
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('위젯 초기화 실패:', error);
            alert('결제 위젯을 불러오는 중 오류가 발생했습니다.');
        }
    };

    const handleCloseModal = () => {
        setShowPaymentWidget(false);
        setAgreementChecked(false);
        setTossWidgets(null);
        const paymentMethodEl = document.getElementById('payment-method');
        const agreementEl = document.getElementById('agreement');
        if (paymentMethodEl) {
            paymentMethodEl.innerHTML = '';
            while (paymentMethodEl.firstChild) {
                paymentMethodEl.removeChild(paymentMethodEl.firstChild);
            }
        }
        if (agreementEl) {
            agreementEl.innerHTML = '';
            while (agreementEl.firstChild) {
                agreementEl.removeChild(agreementEl.firstChild);
            }
        }
        // body 스크롤 복원
        document.body.style.overflow = '';
    };

    const handlePaymentRequest = async () => {
        if (!tossWidgets) {
            alert('결제 위젯이 준비되지 않았습니다.');
            return;
        }

        const amount = parseInt(chargeAmount);
        if (!amount || amount < 1000) {
            alert('충전할 금액을 확인해주세요.');
            return;
        }

        setLoading(true);
        try {
            // 주문 정보 생성
            const orderId = `mileage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const orderName = `마일리지 ${amount.toLocaleString()}원 충전`;

            // 토스페이먼츠 결제창 열기
            await tossWidgets.requestPayment({
                orderId: orderId,
                orderName: orderName,
                successUrl: `${window.location.origin}/mileage/charge/success?orderId=${orderId}&amount=${amount}`,
                failUrl: `${window.location.origin}/mileage/charge/fail`,
                customerEmail: localStorage.getItem('email') || '',
                customerName: name || '고객',
            });
        } catch (error) {
            console.error('결제 요청 실패:', error);
            alert('결제 요청 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    };

    const getTypeLabel = (type) => {
        const labels = {
            'CHARGE': '충전',
            'USE': '사용',
            'EARN': '적립',
            'REFUND': '환불',
            'WITHDRAW': '출금'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            'CHARGE': 'text-primary',
            'USE': 'text-danger',
            'EARN': 'text-success',
            'REFUND': 'text-info',
            'WITHDRAW': 'text-danger'
        };
        return colors[type] || '';
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseInt(withdrawAmount) <= 0) {
            alert('출금할 금액을 입력해주세요.');
            return;
        }

        if (parseInt(withdrawAmount) > balance) {
            alert('보유 마일리지보다 많은 금액을 출금할 수 없습니다.');
            return;
        }

        if (!withdrawAccount || withdrawAccount.trim() === '') {
            alert('계좌번호를 입력해주세요.');
            return;
        }

        if (!bankName || bankName.trim() === '') {
            alert('은행명을 입력해주세요.');
            return;
        }

        if (parseInt(withdrawAmount) < 1000) {
            alert('최소 출금 금액은 1,000원입니다.');
            return;
        }

        if (!window.confirm(`${parseInt(withdrawAmount).toLocaleString()}원을 출금하시겠습니까?`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/withdraw/request', {
                amount: parseInt(withdrawAmount),
                bankName: bankName.trim(),
                accountNumber: withdrawAccount.trim()
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                alert('출금 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.');
                setWithdrawAmount('');
                setWithdrawAccount('');
                setBankName('');
                // 잔액 다시 조회
                fetchBalance();
                fetchHistory();
                fetchWithdrawRequests();
            } else {
                alert(response.data.message || '출금 요청에 실패했습니다.');
            }
        } catch (error) {
            console.error('출금 실패:', error);
            const errorMessage = error.response?.data?.message || '출금 요청 중 오류가 발생했습니다.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 일반 사용자 메뉴
    const userMenu = [
        {
            id: 'history',
            icon: "/img/icon-1.png",
            title: "마일리지 충전/출금 내역",
            action: () => setActiveMenu('history')
        },
        {
            id: 'charge',
            icon: "/img/icon-1.png",
            title: "마일리지 충전하기",
            action: () => setActiveMenu('charge')
        },
        {
            id: 'withdraw',
            icon: "/img/icon-1.png",
            title: "마일리지 출금하기",
            action: () => setActiveMenu('withdraw')
        }
    ];


    return (
        <div>
            <div className="container-fluid page-header">
                <div className="container mileage-container">
                    <h1 className="display-3 mb-4">나의 마일리지</h1>

                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><Link to="/" className="text-muted">홈페이지</Link></li>
                            <li className="breadcrumb-item"><Link to="/userpage" className="text-muted">마이페이지</Link></li>
                            <li className="breadcrumb-item text-dark active">마일리지</li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* 일반 회원 메뉴 (모든 사용자) */}
                {activeTab === "user" && (
                <div className="container py-5">
                    {/* 마일리지 잔액 카드 */}
                    <div className="card mb-4 shadow-sm">
                        <div className="card-body text-center py-5">
                            <h4 className="text-muted mb-3">보유 마일리지</h4>
                            <h1 className="display-4 text-primary mb-4">
                                {balance.toLocaleString()}원
                            </h1>
                        </div>
                    </div>

                    {/* 메뉴 카드 */}
                    <div className="row g-4 mb-5">
                        {userMenu.map((item) => (
                            <div className="col-lg-4 col-md-6" key={item.id}>
                                <div
                                    className={`d-flex bg-light p-4 rounded shadow-sm align-items-start h-100 mileage-menu-card ${activeMenu === item.id ? 'active' : ''}`}
                                    onClick={item.action}
                                >
                                        <img
                                            src={item.icon}
                                            className="mileage-menu-icon"
                                            alt={item.title}
                                        />
                                        <div>
                                            <h5 className="mb-2">
                                                {item.title}
                                            </h5>
                                        </div>
                                    </div>
                            </div>
                        ))}
                    </div>

                    {/* 마일리지 충전 내역 */}
                    {activeMenu === 'history' && (
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h5 className="mb-0">마일리지 내역</h5>
                            </div>
                            {/* 탭 버튼 */}
                            <div className="card-header border-bottom-0 mileage-tab-header">
                                <ul className="nav nav-tabs card-header-tabs border-0">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link mileage-tab-button ${historyTab === 'transactions' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('transactions')}
                                        >
                                            충전 내역
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link mileage-tab-button ${historyTab === 'withdraw' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('withdraw')}
                                        >
                                            출금 내역
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div className="card-body">
                                {/* 충전 내역 탭 */}
                                {historyTab === 'transactions' && (
                                    <>
                                        {transactions.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                거래 내역이 없습니다.
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>날짜</th>
                                                            <th>유형</th>
                                                            <th>금액</th>
                                                            <th>거래 후 잔액</th>
                                                            <th>설명</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {transactions.map((transaction) => (
                                                            <tr key={transaction.id}>
                                                                <td>{formatDate(transaction.createdAt)}</td>
                                                                <td>
                                                                    <span className={getTypeColor(transaction.type)}>
                                                                        {getTypeLabel(transaction.type)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {(transaction.type === 'USE' || transaction.type === 'WITHDRAW') ? '-' : '+'}
                                                                    {transaction.amount.toLocaleString()}원
                                                                </td>
                                                                <td>{transaction.balanceAfter.toLocaleString()}원</td>
                                                                <td>{transaction.description}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* 출금 내역 탭 */}
                                {historyTab === 'withdraw' && (
                                    <>
                                        {withdrawRequests.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                출금 신청 내역이 없습니다.
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>신청일시</th>
                                                            <th>금액</th>
                                                            <th>은행명</th>
                                                            <th>계좌번호</th>
                                                            <th className="text-center">상태</th>
                                                            <th>처리일시</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {withdrawRequests.map((request) => {
                                                            const getStatusBadge = (status) => {
                                                                switch (status) {
                                                                    case 'PENDING':
                                                                        return <span className="badge bg-warning">대기중</span>;
                                                                    case 'APPROVED':
                                                                        return <span className="badge bg-success">승인됨</span>;
                                                                    case 'REJECTED':
                                                                        return (
                                                                            <span className="badge bg-danger">
                                                                                거절됨
                                                                                {request.rejectReason && (
                                                                                    <i className="fa fa-info-circle ms-1 mileage-info-icon" title="클릭하여 상세정보 보기"></i>
                                                                                )}
                                                                            </span>
                                                                        );
                                                                    default:
                                                                        return <span className="badge bg-secondary">{status}</span>;
                                                                }
                                                            };
                                                            return (
                                                                <tr 
                                                                    key={request.id}
                                                                    className="mileage-withdraw-row"
                                                                    onClick={() => {
                                                                        setSelectedRequest(request);
                                                                        setShowRequestModal(true);
                                                                    }}
                                                                >
                                                                    <td>{formatDate(request.requestedAt)}</td>
                                                                    <td className="fw-bold">{parseInt(request.amount || 0).toLocaleString()}원</td>
                                                                    <td>{request.bankName}</td>
                                                                    <td>{request.accountNumber}</td>
                                                                    <td className="text-center" onClick={(e) => e.stopPropagation()}>{getStatusBadge(request.status)}</td>
                                                                    <td>{request.processedAt ? formatDate(request.processedAt) : '-'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                               
                                            </div>
                                        )}
                                    </>
                                )}
                            </div> <GotoBack />
                        </div>
                    )}

                    {/* 마일리지 충전하기 */}
                    {activeMenu === 'charge' && (
                        <div className="card shadow-sm" data-section="charge">
                            <div className="card-header">
                                <h5 className="mb-0">마일리지 충전하기</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-4">
                                    <label className="form-label">충전할 금액</label>
                                    
                                    {/* 금액 선택 방식 선택 */}
                                    <div className="btn-group mb-3 w-100" role="group">
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            name="chargeType"
                                            id="chargeTypeSelect"
                                            checked={chargeAmountType === 'select'}
                                            onChange={() => {
                                                setChargeAmountType('select');
                                                setChargeAmount('');
                                            }}
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="chargeTypeSelect">
                                            금액 선택
                                        </label>
                                        
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            name="chargeType"
                                            id="chargeTypeDirect"
                                            checked={chargeAmountType === 'direct'}
                                            onChange={() => {
                                                setChargeAmountType('direct');
                                                setChargeAmount('');
                                            }}
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="chargeTypeDirect">
                                            직접 입력
                                        </label>
                                    </div>

                                    {/* 금액 선택 (select) */}
                                    {chargeAmountType === 'select' && (
                                        <select
                                            className="form-select form-select-lg"
                                            value={chargeAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setChargeAmount(value);
                                                console.log('Select changed:', value);
                                            }}
                                        >
                                            <option value="">금액을 선택하세요</option>
                                            <option value="5000">5,000원</option>
                                            <option value="10000">10,000원</option>
                                            <option value="20000">20,000원</option>
                                            <option value="30000">30,000원</option>
                                            <option value="50000">50,000원</option>
                                            <option value="100000">100,000원</option>
                                            <option value="150000">150,000원</option>
                                        </select>
                                    )}

                                    {/* 직접 입력 */}
                                    {chargeAmountType === 'direct' && (
                                        <input
                                            type="number"
                                            className="form-control form-control-lg"
                                            value={chargeAmount}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/,/g, '');
                                                // 숫자만 입력 허용 (빈 문자열도 허용)
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    setChargeAmount(value);
                                                    console.log('Input changed:', value);
                                                }
                                            }}
                                            placeholder="충전할 금액을 직접 입력하세요"
                                            min="1000"
                                            step="1000"
                                        />
                                    )}

                                    {/* 선택된 금액 표시 */}
                                    {chargeAmount && (
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <strong>충전 금액: </strong>
                                            <span className="text-primary fs-4">
                                                {parseInt(chargeAmount || 0).toLocaleString()}원
                                            </span>
                                        </div>
                                    )}
                                    
                                    <small className="text-muted">최소 충전 금액: 1,000원</small>
                                </div>


                                <div className="alert alert-info">
                                    <strong>충전 안내</strong><br/>
                                    • 최소 충전 금액: 1,000원<br/>
                                    • 충전된 마일리지는 상품 구매 시 사용 가능합니다.<br/>
                                    • 충전 후 즉시 사용 가능합니다.
                                </div>
                                
                                {/* 결제 위젯 모달 */}
                                {showPaymentWidget && chargeAmount && parseInt(chargeAmount) >= 1000 && (
                                    <>
                                        <div 
                                            className="modal-backdrop fade show mileage-modal-backdrop"
                                        ></div>
                                        <div 
                                            className="modal fade show mileage-modal"
                                            tabIndex="-1"
                                            role="dialog"
                                            aria-modal="true"
                                            onClick={(e) => {
                                                if (e.target === e.currentTarget) {
                                                    handleCloseModal();
                                                }
                                            }}
                                        >
                                            <div className="modal-dialog modal-dialog-centered modal-lg mileage-modal-dialog" onClick={(e) => e.stopPropagation()}>
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h5 className="modal-title">마일리지 충전</h5>
                                                        <button 
                                                            type="button" 
                                                            className="btn-close" 
                                                            onClick={handleCloseModal}
                                                            aria-label="Close"
                                                        ></button>
                                                    </div>
                                                    <div className="modal-body mileage-modal-body">
                                                        <div className="mb-4 p-3 bg-light rounded">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <strong>충전 금액</strong>
                                                                <span className="text-primary fs-4 fw-bold">
                                                                    {parseInt(chargeAmount || 0).toLocaleString()}원
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label fw-bold">결제 수단 선택</label>
                                                            <div id="payment-method" className="mt-2 mileage-payment-widget"></div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div id="agreement" className="mileage-agreement-widget"></div>
                                                        </div>
                                                    </div>
                                                    <div className="modal-footer border-top pt-3">
                                                        <button
                                                            className="btn btn-outline-secondary btn-lg px-4 mileage-cancel-btn"
                                                            onClick={handleCloseModal}
                                                            disabled={loading}
                                                        >
                                                            <i className="fa fa-times me-2"></i>
                                                            취소
                                                        </button>
                                                        <button
                                                            className="btn btn-lg px-5 mileage-payment-btn"
                                                            onClick={handlePaymentRequest}
                                                            disabled={loading}
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                    처리 중...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fa fa-credit-card me-2"></i>
                                                                    {parseInt(chargeAmount || 0).toLocaleString()}원 결제하기
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* 충전하기 버튼 */}
                                {!showPaymentWidget && (
                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-primary btn-lg"
                                            onClick={handleCharge}
                                            disabled={loading || !chargeAmount || chargeAmount === '' || chargeAmount === '0' || Number(chargeAmount) < 1000}
                                        >
                                            {loading ? '처리 중...' : '충전하기'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 마일리지 출금하기 */}
                    {activeMenu === 'withdraw' && (
                        <div className="card shadow-sm" data-section="withdraw">
                            <div className="card-header">
                                <h5 className="mb-0">마일리지 출금하기</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">출금할 금액</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-lg"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="출금할 금액을 입력하세요"
                                        min="1000"
                                        step="1000"
                                        max={balance}
                                    />
                                    <small className="text-muted">
                                        최소 출금 금액: 1,000원 (보유: {balance.toLocaleString()}원)
                                    </small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">은행명</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="입금 받을 은행을 입력하세요"
                                    />
                                    <small className="text-muted">
                                        예시) 은행명 : 농협
                                    </small>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">출금 계좌번호</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        value={withdrawAccount}
                                        onChange={(e) => setWithdrawAccount(e.target.value)}
                                        placeholder="계좌번호를 입력하세요 (예: 123-456-789012)"
                                    />
                                </div>
                                <div className="alert alert-warning">
                                    <strong>출금 안내</strong><br/>
                                    • 최소 출금 금액: 1,000원<br/>
                                    • 출금 신청 후 1-2일 내 처리됩니다.<br/>
                                    • 출금 수수료가 발생할 수 있습니다.
                                </div>
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleWithdraw}
                                        disabled={loading || !withdrawAmount || parseInt(withdrawAmount) < 1000 || !withdrawAccount || !bankName}
                                    >
                                        {loading ? '처리 중...' : '출금 신청하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    </div>
                )}

            {/* 출금 신청 상세 정보 모달 */}
            {showRequestModal && selectedRequest && (
                <div
                    className="mileage-request-modal"
                    onClick={() => {
                        setShowRequestModal(false);
                        setSelectedRequest(null);
                    }}
                >
                    <div
                        className="mileage-request-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 헤더 */}
                        <div className="mileage-request-modal-header">
                            <h5 className="mb-0">
                                <i className="fa fa-wallet me-2"></i>
                                출금 신청 상세 정보
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setShowRequestModal(false);
                                    setSelectedRequest(null);
                                }}
                                aria-label="Close"
                            ></button>
                        </div>

                        {/* 상태 및 금액 섹션 */}
                        <div className="mileage-request-status-section mb-4">
                            <div className="text-center mb-3">
                                <div className="mb-3">
                                    {selectedRequest.status === 'PENDING' && (
                                        <span className="badge bg-warning mileage-status-badge-lg">
                                            <i className="fa fa-clock me-1"></i>대기중
                                        </span>
                                    )}
                                    {selectedRequest.status === 'APPROVED' && (
                                        <span className="badge bg-success mileage-status-badge-lg">
                                            <i className="fa fa-check-circle me-1"></i>승인됨
                                        </span>
                                    )}
                                    {selectedRequest.status === 'REJECTED' && (
                                        <span className="badge bg-danger mileage-status-badge-lg">
                                            <i className="fa fa-times-circle me-1"></i>거절됨
                                        </span>
                                    )}
                                </div>
                                <div className="mileage-request-amount-compact">
                                    <div className="mileage-request-amount-label-compact">출금 금액</div>
                                    <div className="mileage-request-amount-value-compact">
                                        {parseInt(selectedRequest.amount || 0).toLocaleString()}원
                                    </div>
                                </div>
                                {selectedRequest.processedAt && (
                                    <small className="text-muted d-block mt-2">
                                        처리일시: {formatDate(selectedRequest.processedAt)}
                                    </small>
                                )}
                            </div>
                        </div>

                        {/* 거절 사유 (있는 경우만 표시) */}
                        {selectedRequest.status === 'REJECTED' && selectedRequest.rejectReason && (
                            <div className="mileage-request-reject-reason mb-4">
                                <div className="mileage-request-reject-header">
                                    <i className="fa fa-exclamation-triangle me-2"></i>
                                    거절 사유
                                </div>
                                <div className="mileage-request-reject-content">
                                    {selectedRequest.rejectReason}
                                </div>
                            </div>
                        )}

                        {/* 하단 버튼 */}
                        <div className="mileage-request-modal-footer">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowRequestModal(false);
                                    setSelectedRequest(null);
                                }}
                            >
                                <i className="fa fa-times me-2"></i>닫기
                            </button> 
                        </div>
                    </div>
                </div>
            )}
             
        </div>
    );
};

export default Mileage;