import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Pagination from '../components/Pagination';

const AdminUser = () => {
    
    const [user, setUser] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ nickname: "", role: "member", isActive: true })
    const [members, setMembers] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [page, setPage] = useState(0);
    const [size] = useState(10); // 페이지당 항목 수
    const [totalPage, setTotalPage] = useState(0);
    const [allUser, setAllUser] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const userId = localStorage.getItem("userId");

    // 회원 정보 가져오기
    useEffect(() => {
        fetchUsers();
    },[]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/member/all");
            setAllUser(res.data);
        } catch (err) {
            console.error("사용자 불러오기 실패:", err);
        }
    };

    useEffect(() => {
        let temp = allUser;

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);
        
        setFilteredUsers(paginatedData)
    }, [allUser, page, size]);

    const socialLogin = (provider, text) => {
        if (provider === 'kakao') {
            text = 'KAKAO 로그인 회원';
        }
        if (provider === 'naver') {
            text = 'NAVER 로그인 회원';
        }
        return shortenText(text, 12);
    }

    // id 길면 자르기
    const shortenText = (text, maxLength = 12) => {
        if (!text) return "";

        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    // 회원 삭제
    const handleDelete = async (userId) => {
        if (!window.confirm("게시한 판매목록 및 게시글이 모두 삭제됩니다. 탈퇴하시겠습니까?")) return;

        try {
            await axios.delete(`http://localhost:8080/api/member/delete/${userId}`);

            alert("회원 탈퇴가 완료되었습니다.");

            window.location.replace("/admin/user");
        
        } catch (err) {
            alert("회원 탈퇴 중 오류가 발생했습니다.");
        }
    };

    // 수정 모달 열기
    const openEditModal = (member) => {
        setEditingUser(member);
        setEditForm({ 
            nickname: member.nickname || "",
            role: member.role, 
            isActive: member.isActive,
        });
    }

    // 수정
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    // 수정 저장
    const saveEdit = async () => {
        const token = localStorage.getItem("token");
        console.log("토큰:", token);
        
        if (!token) {
            alert("토큰이 없습니다. 다시 로그인해주세요.");
            return;
        }

        try {
            // URL에서 /{userId} 제거하고, Body에 userId 포함
            const updateData = {
                userId: editingUser.userId,  // userId를 Body에 포함
                ...editForm
            };
            
            console.log("전송 데이터:", updateData);

            const res = await axios.put(
                `http://localhost:8080/api/member/updateByAdmin`,  // /{userId} 제거
                updateData,  // userId를 포함한 데이터 전송
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("서버 응답:", res.data);

            // 로그인 중인 사용자가 자기 정보 수정 시 localStorage 업데이트
            const loggedUser = JSON.parse(localStorage.getItem("user"));
            console.log("loggedUser:", loggedUser);
            console.log("editingUser:", editingUser);

            if (loggedUser && loggedUser.id === editingUser.userId) {
                const updatedHeaderUser = {
                    ...updateData,
                    id: updateData.userId
                };
                localStorage.setItem("user", JSON.stringify(updatedHeaderUser));
                setUser(updatedHeaderUser);
            }

            setEditingUser(null);
            
            // 사용자 목록 새로고침
            fetchUsers();

            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 3000)

        } catch (err) {
            console.error("사용자 수정 실패:");
            console.error("상태 코드:", err.response?.status);
            console.error("에러 메시지:", err.response?.data);
            
            alert(`수정 중 오류가 발생했습니다.\n${err.response?.data?.message || "서버 오류"}`);
        }
    };

    return (
        <div>
            {/* 사용자 관리 섹션 */}
            <div>
                <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <p style={{fontSize: '14px', color: '#777'}}>총 {allUser.length}명의 사용자</p>
                </div>
                
                <div className="admin-card">
                <div style={{padding: 0}}>
                    <table className="admin-table">
                    <thead className="admin-thead">
                        <tr>
                        <th className="admin-th" style={{textAlign: 'center'}}>사용자 ID</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>이름</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>닉네임</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>이메일</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>연락처</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>상태</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>권한</th>
                        <th className="admin-th" style={{textAlign: 'center'}}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((member) => (
                        <tr key={member.userId}>
                            <td className="admin-td" style={{fontWeight: 'bold'}}>{socialLogin(member.provider, member.userId)}</td>
                            <td className="admin-td">{member.name}</td>
                            <td className="admin-td" style={{textAlign: 'center'}}>{member.nickname}</td>
                            <td className="admin-td">{member.email}</td>
                            <td className="admin-td" style={{textAlign: 'center'}}>{member.phone}</td>
                            <td className="admin-td" style={{textAlign: 'center'}}>
                                {member.isActive === true && '활성'}
                                {member.isActive === false && '비활성'}
                            </td>
                            <td className="admin-td" style={{textAlign: 'center'}}>
                            <span className={`admin-badge ${member.role === 'ROLE_ADMIN' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                {member.role === 'ROLE_USER' && '사용자'}
                                {member.role === 'ROLE_SELLER' && '판매자'}
                                {member.role === 'ROLE_ADMIN' && '관리자'}
                            </span>
                            </td>
                            <td className="admin-td" style={{textAlign: 'center'}}>
                                <button type='button' className="admin-link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(member);
                                }}>수정</button>
                                <button type='button' className="admin-link admin-link-danger" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(member.userId);
                                }}>삭제</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>

            {editingUser && (
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
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div className="order-modal-content" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        {/* 사용자 수정 헤더 */}
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
                                사용자 수정
                            </h2>
                            <button
                                onClick={() => setEditingUser(null)}
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

                        {/* 사용자 수정 폼 */}
                        <div 
                            className="order-info-section" 
                            style={{ marginBottom: '25px' }}
                        >
                            <h3 
                                style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#333', 
                                    marginBottom: '15px' 
                                }}
                            >
                                닉네임
                            </h3>
                            <input
                                type="text"
                                name="nickname"
                                value={editForm.nickname}
                                onChange={handleEditChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div 
                            className="order-info-section" 
                            style={{ marginBottom: '25px' }}
                        >
                            <h3 
                                style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#333', 
                                    marginBottom: '15px' 
                                }}
                            >
                                권한
                            </h3>
                            {editForm.role === 'ROLE_SELLER' ? (
                                <select
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditChange}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'not-allowed',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="ROLE_SELLER">판매자</option>
                                </select>
                            ) : (
                                <select
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        boxSizing: 'border-box',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="ROLE_USER">사용자</option>
                                    <option value="ROLE_ADMIN">관리자</option>
                                </select>
                            )}
                        </div>
                        <div 
                            className="order-info-section" 
                            style={{ marginBottom: '25px' }}
                        >
                            <h3 
                                style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#333', 
                                    marginBottom: '15px' 
                                }}
                            >
                                활성 여부
                            </h3>
                            {userId === editingUser.userId && (
                                <span style={{ color: '#e74c3c', fontSize: '12px' }}>
                                    (본인 계정은 활성 상태 변경이 불가합니다.)
                                </span>
                            )}
                            {userId !== editingUser.userId &&  (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                                    <label
                                        htmlFor="isActiveToggle"
                                        style={{
                                            position: 'relative',
                                            display: 'inline-block',
                                            width: '50px',
                                            height: '26px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            id="isActiveToggle"
                                            type="checkbox"
                                            name="isActive"
                                            checked={editForm.isActive}
                                            onChange={handleEditChange}
                                            style={{
                                                opacity: 0,
                                                width: 0,
                                                height: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: editForm.isActive ? '#3CB815' : '#ccc',
                                                borderRadius: '26px',
                                                transition: 'background-color 0.3s',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    content: '""',
                                                    height: '20px',
                                                    width: '20px',
                                                    left: '3px',
                                                    bottom: '3px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '50%',
                                                    transition: 'transform 0.3s',
                                                    transform: editForm.isActive ? 'translateX(24px)' : 'translateX(0)',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                }}
                                            />
                                        </span>
                                    </label>
                                    
                                        <span style={{ fontSize: '16px', userSelect: 'none' }}>
                                            {editForm.isActive ? '활성' : '비활성'}
                                        </span>
                                </div>
                            )}
                        </div>
                        
                        {/* 버튼 그룹 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button
                                className="admin-btn"
                                onClick={() => setEditingUser(null)}
                                style={{ backgroundColor: '#95a5a6' }}
                            >
                                닫기
                            </button>
                            <button
                                className="admin-btn btn-primary"
                                onClick={saveEdit}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                    <div
                        className='fadeIn wow'
                        style={{
                            position: "fixed",
                            bottom: "20px",
                            right: "20px",
                            backgroundColor: "#4caf50",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "5px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                    >
                        사용자의 정보가 수정되었습니다!
                    </div>
                )}

            <Pagination
                page={page}
                totalPages={totalPage}
                onPageChange={setPage}
            />
        </div>
    );
};

export default AdminUser;