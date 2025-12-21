import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Pagination from '../components/Pagination';

const AdminWithdraw = () => {
    const [requests, setRequests] = useState([]);
    const [userRequests, setUserRequests] = useState([]);
    const [sellerRequests, setSellerRequests] = useState([]);
    const [filteredUserRequests, setFilteredUserRequests] = useState([]);
    const [filteredSellerRequests, setFilteredSellerRequests] = useState([]);
    const [userFilterStatus, setUserFilterStatus] = useState('전체');
    const [sellerFilterStatus, setSellerFilterStatus] = useState('전체');
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState(null);
    const token = localStorage.getItem("token");
    const [userPage, setUserPage] = useState(0);
    const [sellerPage, setSellerPage] = useState(0);
    const [size] = useState(10); // 페이지당 항목 수
    const [userTotalPage, setUserTotalPage] = useState(0);
    const [sellerTotalPage, setSellerTotalPage] = useState(0);

    // 출금 요청 목록 가져오기
    useEffect(() => {
        fetchWithdrawRequests();
    }, []);

    // 사용자 출금 요청 필터 및 페이지네이션
    useEffect(() => {
        let temp = userRequests;

        if (userFilterStatus !== '전체') {
            const statusMap = {
                '대기중': 'PENDING',
                '승인됨': 'APPROVED',
                '거절됨': 'REJECTED'
            };
            temp = temp.filter(request => request.status === statusMap[userFilterStatus]);
        }

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setUserTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = userPage * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);

        setFilteredUserRequests(paginatedData);
    }, [userFilterStatus, userRequests, userPage, size]);

    // 판매자 정산 요청 필터 및 페이지네이션
    useEffect(() => {
        let temp = sellerRequests;

        if (sellerFilterStatus !== '전체') {
            const statusMap = {
                '대기중': 'PENDING',
                '승인됨': 'APPROVED',
                '거절됨': 'REJECTED'
            };
            temp = temp.filter(request => request.status === statusMap[sellerFilterStatus]);
        }

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setSellerTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = sellerPage * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);

        setFilteredSellerRequests(paginatedData);
    }, [sellerFilterStatus, sellerRequests, sellerPage, size]);

    const fetchWithdrawRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/withdraw/admin/all', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const allRequests = response.data.requests || [];
            setRequests(allRequests);
            
            // USER와 SELLER로 분리 및 정렬 (요청일시 내림차순 - 최신순)
            const userReqs = allRequests
                .filter(req => req.type === 'USER')
                .sort((a, b) => {
                    const dateA = new Date(a.requestedAt || 0);
                    const dateB = new Date(b.requestedAt || 0);
                    return dateB - dateA; // 내림차순
                });
            const sellerReqs = allRequests
                .filter(req => req.type === 'SELLER')
                .sort((a, b) => {
                    const dateA = new Date(a.requestedAt || 0);
                    const dateB = new Date(b.requestedAt || 0);
                    return dateB - dateA; // 내림차순
                });
            
            setUserRequests(userReqs);
            setSellerRequests(sellerReqs);
        } catch (error) {
            console.error('출금 요청 목록 조회 오류:', error);
            alert('출금 요청 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 출금 요청 승인
    const handleApprove = async (requestId) => {
        // 요청 타입 확인
        const request = requests.find(r => r.id === requestId);
        const isSeller = request?.type === 'SELLER';
        const confirmMessage = isSeller ? '이 정산 요청을 승인하시겠습니까?' : '이 출금 요청을 승인하시겠습니까?';
        const successMessage = isSeller ? '정산 요청이 승인되었습니다.' : '출금 요청이 승인되었습니다.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await api.post(`/api/withdraw/admin/approve/${requestId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                alert(successMessage);
                fetchWithdrawRequests();
            } else {
                alert(response.data.message || '승인 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('출금 요청 승인 오류:', error);
            const errorMessage = error.response?.data?.message || '승인 처리 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    };

    // 출금 요청 거절 모달 열기
    const handleRejectClick = (requestId) => {
        setRejectingId(requestId);
        setRejectReason('');
        setShowRejectModal(true);
    };

    // 출금 요청 거절
    const handleReject = async () => {
        if (!rejectReason || rejectReason.trim() === '') {
            alert('거절 사유를 입력해주세요.');
            return;
        }

        // 요청 타입 확인
        const request = requests.find(r => r.id === rejectingId);
        const isSeller = request?.type === 'SELLER';
        const successMessage = isSeller ? '정산 요청이 거절되었습니다.' : '출금 요청이 거절되었습니다.';

        try {
            const response = await api.post(`/api/withdraw/admin/reject/${rejectingId}`, {
                rejectReason: rejectReason.trim()
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                alert(successMessage);
                setShowRejectModal(false);
                setRejectReason('');
                setRejectingId(null);
                fetchWithdrawRequests();
            } else {
                alert(response.data.message || '거절 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('출금 요청 거절 오류:', error);
            const errorMessage = error.response?.data?.message || '거절 처리 중 오류가 발생했습니다.';
            alert(errorMessage);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    };

    // 상태 한글 변환
    const getStatusLabel = (status) => {
        const statusMap = {
            'PENDING': { label: '대기중', className: 'admin-badge-warning' },
            'APPROVED': { label: '승인됨', className: 'admin-badge-success' },
            'REJECTED': { label: '거절됨', className: 'admin-badge-danger' }
        };
        return statusMap[status] || { label: status, className: '' };
    };

    // 숫자 포맷팅
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return Number(num).toLocaleString('ko-KR');
    };

    // 테이블 렌더링 함수
    const renderTable = (filteredRequests, type) => {
        if (loading) {
            return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>;
        }
        
        if (filteredRequests.length === 0) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    {type === 'USER' ? '출금 요청이 없습니다.' : '정산 요청이 없습니다.'}
                </div>
            );
        }

        return (
            <table className="admin-table admin-withdraw-table">
                <thead className="admin-thead">
                    <tr>
                        <th className="admin-th admin-withdraw-th-date">요청일시</th>
                        <th className="admin-th admin-withdraw-th-userid">사용자ID</th>
                        <th className="admin-th admin-withdraw-th-username">사용자명</th>
                        <th className="admin-th admin-withdraw-th-amount">{type === 'USER' ? '출금금액' : '정산금액'}</th>
                        <th className="admin-th admin-withdraw-th-bank">은행명</th>
                        <th className="admin-th admin-withdraw-th-account">계좌번호</th>
                        <th className="admin-th admin-withdraw-th-status">상태</th>
                        <th className="admin-th admin-withdraw-th-processed">처리일시</th>
                        <th className="admin-th admin-withdraw-th-action">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRequests.map((request) => {
                        const statusInfo = getStatusLabel(request.status);
                        return (
                            <tr key={request.id}>
                                <td className="admin-td admin-withdraw-td-date">{formatDate(request.requestedAt)}</td>
                                <td className="admin-td admin-withdraw-td-userid">{request.userId}</td>
                                <td className="admin-td admin-withdraw-td-username">{request.userName || '-'}</td>
                                <td className="admin-td admin-withdraw-td-amount">
                                    {formatNumber(request.amount)}원
                                </td>
                                <td className="admin-td admin-withdraw-td-bank">{request.bankName}</td>
                                <td className="admin-td admin-withdraw-td-account">{request.accountNumber}</td>
                                <td className="admin-td admin-withdraw-td-status">
                                    <span className={`admin-badge ${statusInfo.className}`}>
                                        {statusInfo.label}
                                    </span>
                                </td>
                                <td className="admin-td admin-withdraw-td-processed">
                                    {request.processedAt ? formatDate(request.processedAt) : '-'}
                                </td>
                                <td className="admin-td admin-withdraw-td-action">
                                    {request.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleApprove(request.id)}
                                                style={{
                                                    padding: '4px 10px',
                                                    backgroundColor: '#28a745',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                승인
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(request.id)}
                                                style={{
                                                    padding: '4px 10px',
                                                    backgroundColor: '#dc3545',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                거절
                                            </button>
                                        </div>
                                    )}
                                    {request.status === 'REJECTED' && request.rejectReason && (
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(request);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#6c757d',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            사유보기
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            {/* 사용자 출금 신청 카드 */}
            <div className="admin-card" style={{ marginBottom: '30px' }}>
                <div className="admin-card-header">
                    <h3 style={{ fontSize: '18px', color: '#333', margin: 0 }}>사용자 출금 신청</h3>
                </div>

                {/* 필터 버튼 */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['전체', '대기중', '승인됨', '거절됨'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setUserFilterStatus(status);
                                    setUserPage(0);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: userFilterStatus === status ? '#007bff' : '#fff',
                                    color: userFilterStatus === status ? '#fff' : '#333',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 테이블 */}
                <div style={{ padding: 0, overflowX: 'auto' }}>
                    {renderTable(filteredUserRequests, 'USER')}
                </div>

                {/* 페이지네이션 */}
                <div style={{ marginTop: '20px' }}>
                    <Pagination
                        page={userPage}
                        totalPages={userTotalPage}
                        onPageChange={setUserPage}
                    />
                </div>
            </div>

            {/* 판매자 정산 요청 카드 */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h3 style={{ fontSize: '18px', color: '#333', margin: 0 }}>판매자 정산 요청</h3>
                </div>

                {/* 필터 버튼 */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['전체', '대기중', '승인됨', '거절됨'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setSellerFilterStatus(status);
                                    setSellerPage(0);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: sellerFilterStatus === status ? '#007bff' : '#fff',
                                    color: sellerFilterStatus === status ? '#fff' : '#333',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 테이블 */}
                <div style={{ padding: 0, overflowX: 'auto' }}>
                    {renderTable(filteredSellerRequests, 'SELLER')}
                </div>

                {/* 페이지네이션 */}
                <div style={{ marginTop: '20px' }}>
                    <Pagination
                        page={sellerPage}
                        totalPages={sellerTotalPage}
                        onPageChange={setSellerPage}
                    />
                </div>
            </div>

            {/* 거절 모달 */}
            {showRejectModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowRejectModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '30px',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                            {requests.find(r => r.id === rejectingId)?.type === 'SELLER' ? '정산 요청 거절' : '출금 요청 거절'}
                        </h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                거절 사유
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="거절 사유를 입력해주세요"
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setRejectingId(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleReject}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                거절하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 거절 사유 보기 모달 */}
            {selectedRequest && selectedRequest.status === 'REJECTED' && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setSelectedRequest(null)}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '30px',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>거절 사유</h3>
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {selectedRequest.rejectReason || '사유 없음'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdraw;

