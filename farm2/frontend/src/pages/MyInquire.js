import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const MyInquire = () => {

    const userId = localStorage.getItem("userId");
    const [inquire, setInquire] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:8080/api/contact/user/${userId}`)
            .then(res => {
                setInquire(res.data);
                setLoading(false)
            })
            .catch(err => {
                console.log(err)
                setLoading(true);
            });
    },[]);

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <style>{responsiveStyles}</style>
                        {/* Page Header Start */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{marginRight:'300px'}}>내 문의</h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/">홈페이지</a>
                            </li>
                            <li className="breadcrumb-item" aria-current="page">
                                <a className="text-body" href="/contact">고객센터</a>
                            </li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">
                                내 문의
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
                    <h1 className="display-5 mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>내가 작성한 문의</h1>
                </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>로딩 중...</p>
                </div>
            ) : (
                
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ minWidth: '800px', width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="admin-th" style={{ minWidth: '80px', textAlign: 'center' }}>카테고리</th>
                                <th className="admin-th" style={{ minWidth: '100px', textAlign: 'center' }}>제목</th>
                                <th className="admin-th" style={{ minWidth: '150px', textAlign: 'center' }}>문의 내용</th>
                                <th className="admin-th" style={{ minWidth: '150px', textAlign: 'center' }}>답변 내용</th>
                                <th className="admin-th" style={{ minWidth: '80px', textAlign: 'center' }}>상태</th>
                                <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>문의일</th>
                                <th className="admin-th" style={{ minWidth: '120px', textAlign: 'center' }}>답변일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquire.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                                        문의 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                inquire.map((inq) => (
                                <tr key={inq.id}>
                                    <td className="admin-td" >{inq.category || '-'}</td>
                                    <td className="admin-td" style={{
                                        maxWidth: '200px', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/myinquiredetail/${inq.id}`)}
                                    >{inq.title || '-'}</td>
                                    {inq.status === '답변 완료' ? (
                                    <td className="admin-td" style={{ 
                                        maxWidth: '200px', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/myinquiredetail/${inq.id}`)}
                                    >
                                        [답변완료] {inq.content}
                                    </td>
                                    ) : (
                                    <td className="admin-td" style={{ 
                                        maxWidth: '200px', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/myinquiredetail/${inq.id}`)}
                                    >
                                        {inq.content}
                                    </td>

                                )}
                                    <td className="admin-td" style={{ 
                                        maxWidth: '200px', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => navigate(`/myinquiredetail/${inq.id}`)}
                                    >
                                        {inq.replyContent || '-'}
                                    </td>
                                    <td className="admin-td" style={{ textAlign: 'center' }}>
                                        <span className={`admin-badge ${
                                            inq.status === '답변 완료' 
                                                ? 'admin-badge-success' 
                                                : 'admin-badge-warning'
                                        }`}>
                                            {inq.status || '문의 완료'}
                                        </span>
                                    </td>
                                    <td className="admin-td" style={{ fontSize: '12px' }}>
                                        {formatDate(inq.createdAt)}
                                    </td>
                                    <td className="admin-td" style={{ fontSize: '12px' }}>
                                        {formatDate(inq.repliedAt)}
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </div>
    );
};

export default MyInquire;