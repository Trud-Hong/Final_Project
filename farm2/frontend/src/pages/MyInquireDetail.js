import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 반응형 스타일
const responsiveStyles = `
    @media (max-width: 768px) {
        table {
            font-size: 12px;
        }
        .admin-th, .admin-td {
            padding: 8px 4px !important;
        }
    }
    @media (max-width: 480px) {
        table {
            font-size: 11px;
        }
        .admin-th, .admin-td {
            padding: 6px 3px !important;
        }
    }
`;

const MyInquireDetail = () => {

    const { id } = useParams();
    const [inquire, setInquire] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    const [editData, setEditData] = useState({
        title: '',
        category: '',
        content: '',
    })

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    };

    // 문의 데이터 불러오기
    useEffect(() => {
        if (!id) return;
        
        setLoading(true);
        axios.get(`http://localhost:8080/api/contact/inquire/${id}`)
            .then(res => {
                setInquire(res.data);
                // editData 초기화
                setEditData({
                    id: res.data.id,
                    title: res.data.title || '',
                    category: res.data.category || '',
                    content: res.data.content || '',
                });
                setLoading(false);
            })
            .catch(err => {
                console.log(err)
                setLoading(false);
            });
    },[id]);

    // 수정창 진입
    const handleEditClick = () => {
        if (inquire) {
            setEditData({
                id: inquire.id,
                title: inquire.title || '',
                category: inquire.category || '',
                content: inquire.content || '',
            });
        }
        setIsEditing(true);
    }

    // 수정 취소
    const handleCancelEdit = () => {
        setEditData({
            title: inquire.title,
            category: inquire.category,
            content: inquire.content,
        })
        setIsEditing(false);
    }

    // 입력값 변경
    const handleInputChange = (field,value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 수정 저장
    const handleSaveEdit = () => {
        if (!editData.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!editData.category.trim()) {
            alert('카테고리를 선택해주세요.');
            return;
        }
        if (!editData.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        setLoading(true);
        axios.put('http://localhost:8080/api/contact/updateInquire',editData)
            .then(res => {
                alert('문의가 성공적으로 수정되었습니다.');
                setInquire(res.data);
                setIsEditing(false);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                alert('수정 중 오류가 발생했습니다.');
                setLoading(false);
            })
    }

    // 삭제
    const handleDelete = (inquireId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            axios.delete(`http://localhost:8080/api/contact/delete/${inquireId}`);
            alert('문의가 삭제되었습니다.');
            window.location.href = '/myinquire';
        } catch (error) {
            console.error('문의 삭제 오류:', error);
            alert('문의 삭제 중 오류가 발생했습니다.');
        }
    }

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <style>{responsiveStyles}</style>
            {/* Page Header Start */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{marginRight:'300px'}}>내 문의 상세 조회</h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/">홈페이지</a>
                            </li>
                            <li className="breadcrumb-item" aria-current="page">
                                <a className="text-body" href="/contact">고객센터</a>
                            </li>
                            <li className="breadcrumb-item" aria-current="page">
                                <a className="text-body" href="/myinquire">내 문의</a>
                            </li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">
                                내 문의 상세 조회
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* Page Header End */}

            {/* Contact Start */}
            <div className="container-xxl py-6" style={{ width: '100%', maxWidth: '100%', paddingLeft: '15px', paddingRight: '15px' }}>
                <div 
                    className="section-header text-center mx-auto mb-5 wow fadeInUp" 
                    data-wow-delay="0.1s"
                    style={{ maxWidth: "700px", width: '100%'}}
                >
                    <h1 className="display-5 mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>내가 작성한 문의 상세 조회</h1>
                </div>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>로딩 중...</p>
                </div>
            ) : inquire ? (
                <div className="container-xxl" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingLeft: '15px', paddingRight: '15px' }}>
                    {/* 문의 정보 헤더 */}
                    <div style={{ 
                        backgroundColor: '#fff', 
                        padding: '30px', 
                        borderRadius: '8px',
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
                                    {isEditing ? (
                                        <select
                                            value={editData.category}
                                            onChange={(e) => handleInputChange('category',e.target.value)}
                                            style={{
                                                padding: '5px 12px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                color: '#666',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            <option value="결제 오류">결제 오류</option>
                                            <option value="계정">계정</option>
                                            <option value="오류 제보">오류 제보</option>
                                            <option value="분쟁/신고">분쟁/신고</option>
                                            <option value="환불/교환">환불/교환</option>
                                            <option value="서비스 개선 요청">서비스 개선 요청</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    ) : (
                                        <div style={{ 
                                            display: 'inline-block',
                                            padding: '5px 12px',
                                            backgroundColor: '#f0f0f0',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            color: '#666',
                                            flexShrink: 0
                                        }}>
                                            {inquire.category || '-'}
                                        </div>
                                    )}
                                    
                                    {/* 제목 */}
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            placeholder="제목을 입력하세요"
                                            style={{
                                                flex: 1,
                                                minWidth: '200px',
                                                padding: '10px',
                                                fontSize: '24px',
                                                fontWeight: '600',
                                                lineHeight: '1.6',
                                                border: '1px solid #4CAF50',
                                                borderRadius: '4px',
                                                backgroundColor: '#fff',
                                                color: '#333',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                cursor: 'text'
                                            }}
                                        />
                                    ) : (
                                        <h2 style={{ 
                                            margin: 0, 
                                            color: '#333',
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            lineHeight: '1.4',
                                            flex: 1,
                                            minWidth: '200px'
                                        }}>
                                            {inquire.title || '-'}
                                        </h2>
                                    )}
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '20px', 
                                    flexWrap: 'wrap',
                                    fontSize: '14px',
                                    color: '#666'
                                }}>
                                    <div>
                                        <strong style={{ color: '#333' }}>문의일:</strong> {formatDate(inquire.createdAt)}
                                    </div>
                                    {inquire.repliedAt && (
                                        <div>
                                            <strong style={{ color: '#333' }}>답변일:</strong> {formatDate(inquire.repliedAt)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={`admin-badge ${
                                    inquire.status === '답변 완료' 
                                        ? 'admin-badge-success' 
                                        : 'admin-badge-warning'
                                }`} style={{ 
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}>
                                    {inquire.status || '문의 완료'}
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
                            readOnly={!isEditing}
                            value={isEditing ? editData.content : inquire.content || '-'}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            placeholder={isEditing ? "문의 내용을 입력하세요" : ""}
                            style={{
                                width: '100%',
                                minHeight: '200px',
                                padding: '20px',
                                fontSize: '15px',
                                lineHeight: '1.6',
                                border: isEditing ? '1px solid #4CAF50' : '1px solid #ddd',
                                borderRadius: '6px',
                                backgroundColor: isEditing ? '#fff' : '#fafafa',
                                color: '#333',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                boxSizing: 'border-box',
                                cursor: isEditing ? 'text' : 'default'
                            }}
                        />
                    </div>

                    {/* 답변 내용 */}
                    {inquire.replyContent ? (
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
                                value={inquire.replyContent}
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '20px',
                                    fontSize: '15px',
                                    lineHeight: '1.6',
                                    border: '1px solid #4CAF50',
                                    borderRadius: '6px',
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
                    ) : (
                        <div style={{ 
                            marginBottom: '30px',
                            padding: '30px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '6px',
                            textAlign: 'center',
                            border: '1px solid #ffc107'
                        }}>
                            <p style={{ 
                                margin: 0, 
                                color: '#856404',
                                fontSize: '15px'
                            }}>
                                아직 답변이 등록되지 않았습니다.
                            </p>
                        </div>
                    )}

                    {/* 버튼 그룹 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {isEditing ? (
                            // 수정 모드일 때의 버튼들
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    취소
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveEdit}
                                    disabled={loading}
                                >
                                    {loading ? '저장 중...' : '저장'}
                                </button>
                            </>
                        ) : (
                            // 조회 모드일 때의 버튼들
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/myinquire')}
                                >
                                    뒤로가기
                                </button>
                                {inquire && inquire.status !== '답변 완료' && (
                                    <button
                                    className="btn btn-success"
                                    onClick={handleEditClick}
                                    >
                                        수정
                                    </button>
                                )}
                                {inquire && inquire.status !== '답변 완료' && (
                                    <button
                                        className="btn btn-danger"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(inquire.id);
                                        }}
                                        >
                                        삭제
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>문의 내역을 찾을 수 없습니다.</p>
                </div>
            )}

        </div>
    </div>
    );
};

export default MyInquireDetail;