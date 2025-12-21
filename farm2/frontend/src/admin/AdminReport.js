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
    }
    @media (max-width: 480px) {
        .admin-table {
            font-size: 11px;
        }
        .admin-th, .admin-td {
            padding: 6px 3px !important;
        }
    }
`;

const AdminReport = () => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [adminId, setAdminId] = useState('admin001'); // 실제로는 로그인한 관리자 ID
    const [filterStatus, setFilterStatus] = useState('전체');
    const [filterCategory, setFilterCategory] = useState('전체');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(10); // 페이지당 항목 수
    const [totalPage, setTotalPage] = useState(0);
    const [allContacts, setAllContacts] = useState([]); // 전체 데이터

    // 문의 목록 가져오기
    useEffect(() => {
        fetchContacts();
    }, []);

    // 필터 및 페이지 변경 시 목록 업데이트
    useEffect(() => {
        let temp = allContacts;

        if (filterStatus !== '전체') {
            temp = temp.filter(contact => contact.status === filterStatus);
        }
        if (filterCategory !== '전체') {
            temp = temp.filter(contact => contact.category === filterCategory);
        }

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);
        
        setFilteredContacts(paginatedData);
    }, [filterStatus, filterCategory, allContacts, page, size]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/contact`);
            setAllContacts(response.data);
        } catch (error) {
            console.error('문의 목록 조회 오류:', error);
            alert('문의 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 문의 상세 보기
    const handleViewDetail = (contact) => {
        setSelectedContact(contact);
        setReplyContent('');
    };

    // 답변 제출
    const handleReply = async () => {
        if (!replyContent.trim()) {
            alert('답변 내용을 입력해주세요.');
            return;
        }

        if (!selectedContact) {
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8080/api/contact/reply/${selectedContact.id}`,
                null,
                {
                    params: {
                        adminId: adminId,
                        replyContent: replyContent
                    }
                }
            );

            if (response.data) {
                alert('답변이 성공적으로 등록되었습니다.');
                setSelectedContact(null);
                setReplyContent('');
                fetchContacts(); // 목록 새로고침
            }
        } catch (error) {
            console.error('답변 제출 오류:', error);
            alert('답변 제출 중 오류가 발생했습니다.');
        }
    };

    // 문의 삭제
    const handleDelete = async (contactId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/contact/delete/${contactId}`);
            alert('문의가 삭제되었습니다.');
            fetchContacts(); // 목록 새로고침
        } catch (error) {
            console.error('문의 삭제 오류:', error);
            alert('문의 삭제 중 오류가 발생했습니다.');
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
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
                        총 {allContacts.length}건 | 
                        문의 완료: {allContacts.filter(c => c.status === '문의 완료').length}건 | 
                        답변 완료: {allContacts.filter(c => c.status === '답변 완료').length}건
                    </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <select 
                        className="form-select" 
                        style={{ display: 'inline-block', width: 'auto', minWidth: '120px' }}
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value)
                            setPage(0)
                        }}
                    >
                        <option value="전체">전체</option>
                        <option value="문의 완료">문의 완료</option>
                        <option value="답변 완료">답변 완료</option>
                    </select>
                    <select 
                        className="form-select" 
                        style={{ display: 'inline-block', width: 'auto', minWidth: '150px' }}
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value)
                            setPage(0)
                        }}
                    >
                        <option value="전체">전체</option>
                        <option value="결제 오류">결제 오류</option>
                        <option value="계정">계정</option>
                        <option value="오류 제보">오류 제보</option>
                        <option value="분쟁/신고">분쟁/신고</option>
                        <option value="환불/교환">환불/교환</option>
                        <option value="서비스 개선 요청">서비스 개선 요청</option>
                        <option value="기타">기타</option>
                    </select>
                    <button className="admin-btn" onClick={(e) => {
                        fetchContacts();
                        setPage(0);
                    }}>새로고침</button>
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
                                        <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>사용자 ID</th>
                                        <th className="admin-th" style={{ minWidth: '80px', textAlign: 'center' }}>카테고리</th>
                                        <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>제목</th>
                                        <th className="admin-th" style={{ minWidth: '200px', textAlign: 'center' }}>문의 내용</th>
                                        <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>상태</th>
                                        <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>문의일</th>
                                        <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                                                문의 내역이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredContacts.map((contact) => (
                                            <tr key={contact.id}>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontWeight: 'bold'
                                                }}>{contact.userId || '-'}</td>
                                                <td className="admin-td">{contact.category || '-'}</td>
                                                <td className="admin-td" style={{
                                                    maxWidth: '100px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace:'nowrap'          
                                                }}>{contact.title || '-'}</td>
                                                {contact.status === '답변 완료' ? (
                                                <td className="admin-td" style={{ 
                                                    maxWidth: '300px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace: 'nowrap' 
                                                }}>
                                                    [답변 완료] {contact.content}
                                                </td>
                                                ) : (
                                                <td className="admin-td" style={{ 
                                                    maxWidth: '300px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    whiteSpace: 'nowrap' 
                                                }}>
                                                    {contact.content}
                                                </td>

                                                )}
                                                <td className="admin-td" style={{ textAlign: 'center' }}>
                                                    <span className={`admin-badge ${
                                                        contact.status === '답변 완료' 
                                                            ? 'admin-badge-success' 
                                                            : 'admin-badge-warning'
                                                    }`}>
                                                        {contact.status || '문의 완료'}
                                                    </span>
                                                </td>
                                                <td className="admin-td" style={{ 
                                                    fontSize: '12px',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {(() => {
                                                        const dateParts = formatDateWithBreak(contact.createdAt);
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
                                                    <button type='button' className="admin-link"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetail(contact);
                                                        }}>
                                                            상세
                                                    </button>
                                                    <button type='button' className="admin-link admin-link-danger" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(contact.id);
                                                        }}>
                                                            삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 문의 상세 및 답변 모달 */}
                    {selectedContact && (
                        <div style={{
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
                            <div style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                maxWidth: '700px',
                                width: '100%',
                                maxHeight: '100vh',
                                overflow: 'auto',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                            }}>
                                {/* 문의 정보 헤더 */}
                                <div style={{ 
                                    backgroundColor: '#fff', 
                                    padding: '30px', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    marginBottom: '30px',
                                    borderBottom: '3px solid #4CAF50'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: '15px'
                                    }}>
                                        <div style={{ flex: 1, minWidth: '250px' }}>
                                            {/* 카테고리와 제목을 옆으로 나란히 배치 */}
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '15px',
                                                marginBottom: '15px',
                                                flexWrap: 'wrap'
                                            }}>
                                                {/* 카테고리 */}
                                                <div style={{ 
                                                    display: 'inline-block',
                                                    padding: '5px 12px',
                                                    backgroundColor: '#f0f0f0',
                                                    fontSize: '14px',
                                                    color: '#666',
                                                    flexShrink: 0
                                                }}>
                                                    {selectedContact.category || '-'}
                                                </div>
                                                
                                                {/* 제목 */}
                                                <h2 style={{ 
                                                    margin: 0, 
                                                    color: '#333',
                                                    fontSize: '24px',
                                                    fontWeight: '600',
                                                    lineHeight: '1.4',
                                                    flex: 1,
                                                    minWidth: '200px'
                                                }}>
                                                    {selectedContact.title || '-'}
                                                </h2>
                                            </div>
                                            
                                            <div style={{ 
                                                display: 'flex', 
                                                gap: '20px', 
                                                flexWrap: 'wrap',
                                                fontSize: '14px',
                                                color: '#666',
                                                marginBottom: '10px'
                                            }}>
                                                <div>
                                                    <strong style={{ color: '#333' }}>사용자 ID:</strong> {selectedContact.userId || '-'}
                                                </div>
                                            </div>
                                            
                                            {selectedContact.adminId && (
                                                <div style={{ 
                                                    display: 'flex', 
                                                    gap: '20px', 
                                                    flexWrap: 'wrap',
                                                    fontSize: '14px',
                                                    color: '#666',
                                                    marginBottom: '10px'
                                                }}>
                                                        <div>
                                                            <strong style={{ color: '#333' }}>답변 관리자:</strong> {selectedContact.adminId}
                                                        </div>
                                                </div>
                                            )}

                                            <div style={{ 
                                                display: 'flex', 
                                                gap: '20px', 
                                                flexWrap: 'wrap',
                                                fontSize: '14px',
                                                color: '#666',
                                                marginBottom: '10px'
                                            }}>
                                                <div>
                                                    <strong style={{ color: '#333' }}>문의일:</strong> {formatDate(selectedContact.createdAt)}
                                                </div>
                                                {selectedContact.repliedAt && (
                                                    <div>
                                                        <strong style={{ color: '#333' }}>답변일:</strong> {formatDate(selectedContact.repliedAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`admin-badge ${
                                                selectedContact.status === '답변 완료' 
                                                    ? 'admin-badge-success' 
                                                    : 'admin-badge-warning'
                                            }`} style={{ 
                                                fontSize: '14px',
                                                padding: '8px 16px'
                                            }}>
                                                {selectedContact.status || '문의 완료'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 문의 내용 */}
                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ 
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#333'
                                    }}>
                                        문의 내용
                                    </label>
                                    <textarea
                                        readOnly
                                        value={selectedContact.content || '-'}
                                        style={{
                                            width: '100%',
                                            minHeight: '200px',
                                            padding: '20px',
                                            fontSize: '15px',
                                            lineHeight: '1.6',
                                            border: '1px solid #ddd',
                                            backgroundColor: '#fafafa',
                                            color: '#333',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            boxSizing: 'border-box',
                                            cursor: 'default'
                                        }}
                                    />
                                </div>

                                {/* 답변 내용 */}
                                {selectedContact.replyContent ? (
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ 
                                            display: 'block',
                                            marginBottom: '10px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            답변 내용
                                        </label>
                                        <textarea
                                            readOnly
                                            value={selectedContact.replyContent}
                                            style={{
                                                width: '100%',
                                                minHeight: '200px',
                                                padding: '20px',
                                                fontSize: '15px',
                                                lineHeight: '1.6',
                                                border: '1px solid #4CAF50',
                                                backgroundColor: '#f1f8f4',
                                                color: '#333',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                boxSizing: 'border-box',
                                                cursor: 'default'
                                            }}
                                        />
                                    </div>
                                ) : selectedContact.status !== '답변 완료' && (
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ 
                                            display: 'block',
                                            marginBottom: '10px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            답변 작성
                                        </label>
                                        <textarea
                                            rows="5"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="답변 내용을 입력해주세요."
                                            style={{
                                                width: '100%',
                                                minHeight: '200px',
                                                padding: '20px',
                                                fontSize: '15px',
                                                lineHeight: '1.6',
                                                border: '1px solid #4CAF50',
                                                borderRadius: '6px',
                                                backgroundColor: '#fff',
                                                color: '#333',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* 버튼 그룹 */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                        className="admin-btn"
                                        onClick={() => {
                                            setSelectedContact(null);
                                            setReplyContent('');
                                        }}
                                        style={{ backgroundColor: '#95a5a6' }}
                                    >
                                        닫기
                                    </button>
                                    {selectedContact.status !== '답변 완료' && (
                                        <button
                                            className="admin-btn"
                                            onClick={handleReply}
                                            style={{ backgroundColor: '#16a34a' }}
                                        >
                                            답변 등록
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 페이징 - 모달 밖으로 이동 */}
                    <Pagination
                        page={page}
                        totalPages={totalPage}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
};

export default AdminReport;
