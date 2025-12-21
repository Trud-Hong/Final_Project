import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';

// 반응형 스타일
const responsiveStyles = `
    @media (max-width: 768px) {
        .admin-table {
            font-size: 12px;
        }
        .admin-th, .admin-td {
            padding: 8px 4px !important;
        }
        .order-modal-content {
            padding: 20px !important;
            max-width: 95% !important;
            margin: 10px !important;
        }
        .order-modal-header h2 {
            font-size: 20px !important;
        }
        .order-info-grid {
            grid-template-columns: 1fr !important;
        }
        .order-product-section {
            flex-direction: column !important;
        }
        .order-product-image {
            width: 100% !important;
            height: auto !important;
            max-width: 200px !important;
            margin: 0 auto 15px auto !important;
        }
        .order-product-details-grid {
            grid-template-columns: 1fr !important;
        }
        .order-modal-overlay {
            padding: 10px !important;
        }
        .order-modal-close-btn {
            width: 35px !important;
            height: 35px !important;
            font-size: 28px !important;
        }
    }
    @media (max-width: 480px) {
        .admin-table {
            font-size: 11px;
        }
        .admin-th, .admin-td {
            padding: 6px 3px !important;
        }
        .order-modal-content {
            padding: 15px !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            max-height: 100vh !important;
        }
        .order-modal-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
        }
        .order-modal-header h2 {
            font-size: 18px !important;
        }
        .order-info-section {
            padding: 15px !important;
        }
        .order-product-section {
            padding: 15px !important;
        }
        .order-product-image {
            max-width: 150px !important;
        }
        .order-modal-overlay {
            padding: 0 !important;
            align-items: flex-start !important;
        }
        .order-modal-close-btn {
            width: 40px !important;
            height: 40px !important;
            font-size: 32px !important;
            color: #333 !important;
        }
    }
`;

const AdminTransaction = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState(null);
    const [filterStatus, setFilterStatus] = useState('전체');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(10); // 페이지당 항목 수
    const [totalPage, setTotalPage] = useState(0);

    // 결제 목록 가져오기
    useEffect(() => {
        fetchOrders();
    }, []);

    // 필터 변경 시 목록 업데이트
    useEffect(() => {
        let temp = orders;

        if (filterStatus !== '전체') {
            temp = temp.filter(order => order.status === filterStatus);
        }

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);

        setFilteredOrders(paginatedData);
    }, [filterStatus, orders, page, size]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/api/orders/findAllOrders');
            setOrders(response.data);
            setFilteredOrders(response.data);
        } catch (error) {
            console.error('결제 목록 조회 오류:', error);
            alert('결제 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 결제 상세 보기
    const handleViewDetail = (order) => {
        setSelectedOrders(order);
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    };

    // 숫자 포맷팅 (천 단위 쉼표)
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return Number(num).toLocaleString('ko-KR');
    };

    // 날짜를 두 부분으로 분리 (오전/오후 전에 줄바꿈 가능하도록)
    const formatDateWithBreak = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const dateStr = date.toLocaleString('ko-KR');
        // '오전' 또는 '오후' 앞에서 분리
        const match = dateStr.match(/^(.+?)\s*(오전|오후)\s*(.+)$/);
        if (match) {
            return {
                datePart: match[1].trim(),
                ampm: match[2],
                timePart: match[3]
            };
        }
        return { datePart: dateStr, ampm: '', timePart: '' };
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <style>{responsiveStyles}</style>
            <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div>
                    <p style={{ fontSize: '14px', color: '#777', margin: 0 }}>
                        총 {orders.length}건 | 
                        배송 완료: {orders.filter(c => c.status === '배송완료').length}건
                    </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <select 
                        className="form-select" 
                        style={{ display: 'inline-block', width: 'auto', minWidth: '150px' }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="전체">전체</option>
                        <option value="결제완료">결제완료</option>
                        <option value="배송준비중">배송준비중</option>
                        <option value="배송중">배송중</option>
                        <option value="배송완료">배송완료</option>
                        <option value="거래완료">거래완료</option>
                        <option value="환불완료">환불완료</option>
                        <option value="환불요청">환불요청</option>
                    </select>
                    <button className="admin-btn" onClick={fetchOrders}>새로고침</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>로딩 중...</p>
                </div>
            ) : (
                <>
                    <div className="admin-card">
                        <div style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="admin-table" style={{ minWidth: '800px', width: '100%' }}>
                                <thead className="admin-thead">
                                    <tr>
                                        <th className="admin-th" style={{ minWidth: '50px', textAlign: 'center' }}>사용자 ID</th>
                                        <th className="admin-th" style={{ minWidth: '90px', textAlign: 'center' }}>주문번호</th>
                                        <th className="admin-th" style={{ minWidth: '70px', textAlign: 'center' }}>상품명</th>
                                        <th className="admin-th" style={{ minWidth: '50px', textAlign: 'center' }}>수량</th>
                                        <th className="admin-th" style={{ minWidth: '50px', textAlign: 'center' }}>단가</th>
                                        <th className="admin-th" style={{ minWidth: '50px', textAlign: 'center' }}>총 결제 금액</th>
                                        <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>구매 날짜</th>
                                        <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>결제 상태</th>
                                        <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>인수 상태</th>
                                        <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>상세</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                                                문의 내역이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontWeight: 'bold'
                                                }}>{order.userId || '-'}</td>
                                                <td className="admin-td" style={{
                                                    fontSize: '12px',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }}>{order.id || '-'}</td>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace:'nowrap'          
                                                }}>{order.pname || '-'}</td>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace:'nowrap'          
                                                }}>{formatNumber(order.qty)}</td>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace:'nowrap'          
                                                }}>{formatNumber(order.price)}</td>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace:'nowrap'          
                                                }}>{formatNumber(order.totalPrice)}</td>
                                                <td className="admin-td" style={{ 
                                                    fontSize: '12px',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {(() => {
                                                        const dateParts = formatDateWithBreak(order.orderDate);
                                                        if (dateParts.ampm) {
                                                            return (
                                                                <div style={{ lineHeight: '1.4' }}>
                                                                    <div>{dateParts.datePart}</div>
                                                                    <div>{dateParts.ampm + ' ' + dateParts.timePart}</div>
                                                                </div>
                                                            );
                                                        }
                                                        return dateParts.datePart;
                                                    })()}
                                                </td>
                                                <td className="admin-td" style={{ textAlign: 'center' }}>
                                                    <span className={`admin-badge ${
                                                        order.status === '결제완료' 
                                                        ? 'admin-badge-payment' 
                                                        : order.status === '배송준비중'
                                                        ? 'admin-badge-ready-delivery'
                                                        : order.status === '배송중'
                                                        ? 'admin-badge-shipping-progress'
                                                        : order.status === '거래완료'
                                                        ? 'admin-badge-complete-deal'
                                                        : order.status === '배송완료'
                                                        ? 'admin-badge-complete-delivery'
                                                        : order.status === '환불완료'
                                                        ? 'admin-badge-complete-refund'
                                                        : 'admin-badge-request-refund'
                                                    }`}>
                                                        {order.status || '결제완료'}
                                                    </span>
                                                </td>
                                                <td className="admin-td" style={{ textAlign: 'center' }}>
                                                    <span className={`admin-badge ${
                                                        order.receiveStatus === '인수' 
                                                        ? 'admin-badge-success' 
                                                        : 'admin-badge-warning'
                                                    }`}>
                                                        {order.receiveStatus || '미인수'}
                                                    </span>
                                                </td>

                                                <td className="admin-td" style={{ textAlign: 'center' }}>
                                                    <button type='button' className="admin-link"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetail(order);
                                                    }}>상세</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 주문 상세 모달 */}
                    {selectedOrders && (
                        <div className="order-modal-overlay" style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000,
                            padding: '20px'
                        }}>
                            <div className="order-modal-content" style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                maxWidth: '700px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                            }}>
                                {/* 주문 정보 헤더 */}
                                <div className="order-modal-header" style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '25px',
                                    paddingBottom: '20px',
                                    borderBottom: '2px solid #e0e0e0'
                                }}>
                                    <h2 className="order-modal-header" style={{ 
                                        margin: 0, 
                                        color: '#333',
                                        fontSize: '24px',
                                        fontWeight: '600'
                                    }}>
                                        주문 상세 정보
                                    </h2>
                                    <button
                                        onClick={() => setSelectedOrders(null)}
                                        className="order-modal-close-btn"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            color: '#999',
                                            padding: '0',
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* 주문 기본 정보 */}
                                <div className="order-info-section" style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                                        기본 정보
                                    </h3>
                                    <div className="order-info-grid" style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(2, 1fr)', 
                                        gap: '15px',
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                    }}>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>주문번호</strong>
                                            <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px' }}>
                                                {selectedOrders.id || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>주문일시</strong>
                                            <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px' }}>
                                                {formatDate(selectedOrders.orderDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>판매자 ID</strong>
                                            <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px' }}>
                                                {selectedOrders.sellerId || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>구매자 ID</strong>
                                            <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px' }}>
                                                {selectedOrders.userId || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>결제 상태</strong>
                                            <p style={{ margin: '5px 0 0 0' }}>
                                                <span className={`admin-badge ${
                                                    selectedOrders.status === '결제완료' 
                                                        ? 'admin-badge-payment' 
                                                        : selectedOrders.status === '배송준비중'
                                                        ? 'admin-badge-ready-delivery'
                                                        : selectedOrders.status === '배송중'
                                                        ? 'admin-badge-shipping-progress'
                                                        : selectedOrders.status === '거래완료'
                                                        ? 'admin-badge-complete-deal'
                                                        : selectedOrders.status === '배송완료'
                                                        ? 'admin-badge-complete-delivery'
                                                        : selectedOrders.status === '환불완료'
                                                        ? 'admin-badge-complete-refund'
                                                        : 'admin-badge-request-refund'
                                                }`}>
                                                    {selectedOrders.status || '-'}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666', fontSize: '13px' }}>인수 상태</strong>
                                            <p style={{ margin: '5px 0 0 0' }}>
                                                <span className={`admin-badge ${
                                                    selectedOrders.receiveStatus === '인수' 
                                                        ? 'admin-badge-success' 
                                                        : 'admin-badge-warning'
                                                }`}>
                                                    {selectedOrders.receiveStatus || '미인수'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 상품 정보 */}
                                <div style={{ marginBottom: '25px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                                        상품 정보
                                    </h3>
                                    <div className="order-product-section" style={{ 
                                        display: 'flex', 
                                        gap: '20px',
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                    }}>
                                        {selectedOrders.productImage && (
                                            <img 
                                                src={selectedOrders.productImage} 
                                                alt={selectedOrders.pname}
                                                className="order-product-image"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    flexShrink: 0
                                                }}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                                {selectedOrders.pname || '-'}
                                            </p>
                                            <div className="order-product-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                                                <div>
                                                    <strong style={{ color: '#666' }}>상품 ID:</strong> {selectedOrders.productId || '-'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#666' }}>단가:</strong> {formatNumber(selectedOrders.price)}원
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#666' }}>수량:</strong> {formatNumber(selectedOrders.qty)}개
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#666' }}>총 결제금액:</strong> 
                                                    <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '16px', marginLeft: '5px' }}>
                                                        {formatNumber(selectedOrders.totalPrice)}원
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 마일리지 정보 */}
                                {selectedOrders.mileageUsed && selectedOrders.mileageUsed > 0 && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                                            마일리지 정보
                                        </h3>
                                        <div style={{ 
                                            backgroundColor: '#f8f9fa',
                                            padding: '15px 20px',
                                            borderRadius: '8px'
                                        }}>
                                            <p style={{ margin: 0, fontSize: '14px' }}>
                                                <strong style={{ color: '#666' }}>사용한 마일리지:</strong> 
                                                <span style={{ color: '#27ae60', fontWeight: '600', marginLeft: '5px' }}>
                                                    {formatNumber(selectedOrders.mileageUsed)}원
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* 취소/환불 정보 */}
                                {(selectedOrders.cancelReason || selectedOrders.refundReason) && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                                            취소/환불 정보
                                        </h3>
                                        <div style={{ 
                                            backgroundColor: '#fff5f5',
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid #ffe0e0'
                                        }}>
                                            {selectedOrders.cancelReason && (
                                                <div style={{ marginBottom: selectedOrders.refundReason ? '15px' : '0' }}>
                                                    <strong style={{ color: '#c0392b', fontSize: '14px' }}>취소 사유:</strong>
                                                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                                        {selectedOrders.cancelReason}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedOrders.refundReason && (
                                                <div>
                                                    <strong style={{ color: '#c0392b', fontSize: '14px' }}>환불 사유:</strong>
                                                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                                        {selectedOrders.refundReason}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedOrders.cancelRejectReason && (
                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ffe0e0' }}>
                                                    <strong style={{ color: '#856404', fontSize: '14px' }}>취소 거절 사유:</strong>
                                                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                                        {selectedOrders.cancelRejectReason}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedOrders.refundRejectReason && (
                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ffe0e0' }}>
                                                    <strong style={{ color: '#856404', fontSize: '14px' }}>환불 거절 사유:</strong>
                                                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                                        {selectedOrders.refundRejectReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 버튼 그룹 */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                                    <button
                                        className="admin-btn"
                                        onClick={() => setSelectedOrders(null)}
                                        style={{ backgroundColor: '#95a5a6' }}
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 페이징 */}
            <Pagination
                page={page}
                totalPages={totalPage}
                onPageChange={setPage}
            />
        </div>
    );
};

export default AdminTransaction;
