import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import GotoBack from "../components/GotoBack";

const AddrList = () => {
    const navigate = useNavigate();

    //상태관리
    const [addrList, setAddrList] = useState([]); //배송지 목록
    const [userId, setUserId] = useState(''); //사용자 id
    const [loading, setLoading] = useState(false); //로딩상태
    const [editId, setEditId] = useState(null); //수정중인 배송지id
    const [checkItem, setCheckItem] = useState([]); //체크박스 선택된 항목들

// 수정 중인 배송지 정보 임시저장
    const [editForm, setEditForm] = useState({
        title: '',
        addr1: '',
        addr2: '',
        post: '',
        phone: ''
    });


// 새 배송지 추가
    const [newAddr, setNewAddr] = useState({
        title: '',
        addr1: '',
        addr2: '',
        post: '',
        phone: ''
    });

    const [showAddForm, setShowAddForm] = useState(false);

    const API_URL = 'http://localhost:8080/api/addr';

//  전체 배송지 조회
    const fetchAllAddr = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}?userId=${userId}`);
            const data = await response.json();

            // 정렬하지 않고 그대로 표시 (기본 배송지는 뱃지만 표시)
            setAddrList(data);
            console.log('배송지 조회 완료:', data);
            console.log('각 배송지의 isDefault 값:', data.map(addr => ({ title: addr.title, isDefault: addr.isDefault, default: addr.default })));

        } catch (error) {
            console.error('배송지 조회 실패:', error);
            setAddrList([]);            
        }
        setLoading(false);
    };

    // 배송지 추가
    const newAddrList = async () => {

        if(!newAddr.title || !newAddr.addr1 || !newAddr.post || !newAddr.phone) {
            alert('모든 필수 항목을 입력해주세요');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: userId,
                    title: newAddr.title,
                    addr1: newAddr.addr1,
                    addr2: newAddr.addr2,
                    post: newAddr.post,
                    phone: newAddr.phone
                })
            });

            if(response.ok) {
                alert('배송지가 추가되었습니다.');

                //초기화 시켜
                setNewAddr({title: '', addr1: '', addr2: '', post: '', phone: ''});

                setShowAddForm(false); //등록 후 폼 off
                fetchAllAddr(); //새로고침
            }
        } catch (error) {
            console.error('배송지 추가 실패:', error);
            alert('배송지 추가 실패');
        }
    };

//  수정

    const editAddr = (addr) => {
        setEditId(addr.id); 

        setEditForm({
            title: addr.title,
            addr1: addr.addr1,
            addr2: addr.addr2,
            post: addr.post,
            phone: addr.phone
        });
    };

    //수정 취소
    const cancelEdit = () => {
        setEditId(null);
        setEditForm({ title: '', addr1: '', addr2: '', post: '', phone: ''});
    };

// 수정저장
    const saveEdit = async (id) => {

        if(!editForm.title || !editForm.addr1 || !editForm.post || !editForm.phone) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: editForm.title,
                    addr1: editForm.addr1,
                    addr2: editForm.addr2,
                    post: editForm.post,
                    phone: editForm.phone
                })
            });

            if (response.ok) {
                alert('배송지가 수정되었습니다.');
                setEditId(null); //수정모드 종료
                fetchAllAddr(); //목록 새로고침
            }
        } catch (error) {
            console.error('배송지 수정 실패', error);
            alert('배송지 수정 실패');
            }            
        };

    // 삭제
    const deleteAddr = async (id) => {

        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`${API_URL}/delete/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('배송지가 삭제되었습니다.');
                    fetchAllAddr();//목록 새로고침
                } 
            } catch (error) {
                console.error('배송지 삭제 실패', error);
                alert('배송지 삭제 실패')
            }
        }
    };

    // 기본 배송지 설정
    const setDefaultAddr = async (id) => {
        try {
            const response = await fetch(`${API_URL}/set-default/${id}?userId=${userId}`, {
                method: 'PUT'
            });

            const data = await response.json();

            if (response.ok) {
                alert('기본 배송지로 설정되었습니다.');
                fetchAllAddr(); // 목록 새로고침
            } else {
                console.error('기본 배송지 설정 실패:', response.status, data);
                const errorMessage = data.error || `기본 배송지 설정에 실패했습니다. (${response.status})`;
                alert(errorMessage);
            }
        } catch (error) {
            console.error('기본 배송지 설정 실패', error);
            alert('기본 배송지 설정 중 오류가 발생했습니다: ' + error.message);
        }
    };

    // 전체 체크
    const allCheck = (e) => {
        if (e.target.checked) {

            const allId = addrList.map(addr => addr.id);
            setCheckItem(allId);
        } else {
            setCheckItem([]);
        }
    };

// 개별체크
    const oneCheck = (id) => {
        if (checkItem.includes(id)) {
            // 선택되어 있으면 제거해
            setCheckItem(checkItem.filter(item => item !== id));
        } else {
            setCheckItem([...checkItem, id]);
        }
    };

    // 로그인 체크 
    useEffect(() => {
        const loginUserId = localStorage.getItem('userId');
        if (loginUserId) {
            setUserId(loginUserId);
        } else {
            const currentPath = window.location.pathname;
            window.location.replace('/login?redirect=' + encodeURIComponent(currentPath));
        }
    }, []);

    // 로그인 id 기준 전체 조회
    useEffect(() => {
        if(userId) fetchAllAddr();
    }, [userId]);

    return (
        <div>

            <div className="container-fluid page-header">
                <div className="container" style={{ position: 'relative' }}>
                    <h1 className="display-3 mb-4">나의 배송지 목록</h1>

                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="/" className="text-muted">홈페이지</a></li>
                            <li className="breadcrumb-item"><a href="/userpage" className="text-muted">마이페이지</a></li>
                            <li className="breadcrumb-item text-dark active">배송지 목록</li>
                        </ol>
                    </nav>
                </div>
            </div>

{/* 본문 */}
            <div className="container py-6">

                {/* 배송지 추가 섹션 */}
                {showAddForm && (
                <div className="card mb-4 p-4 bg-light">
                    <h5 className="mb-4">새 배송지 추가</h5>
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold mb-2">배송지 이름 <span className="text-danger">*</span></label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="예: 집, 회사" 
                                value={newAddr.title}
                                onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value})}
                            />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold mb-2">연락처 <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="010-1234-5678"
                                value={newAddr.phone}
                                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value})}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label small fw-semibold mb-2">우편번호 <span className="text-danger">*</span></label>
                            <div className="d-flex gap-2">
                                <input 
                                    type="text"
                                    className="form-control"
                                    placeholder="주소 검색 버튼을 클릭하세요"
                                    value={newAddr.post}
                                    onChange={(e) => setNewAddr({ ...newAddr, post: e.target.value })}
                                    readOnly
                                    style={{ flex: '1' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                        new window.daum.Postcode({
                                            oncomplete: function(data) {
                                                setNewAddr(prev => ({
                                                    ...prev,
                                                    post: data.zonecode,
                                                    addr1: data.address
                                                }));
                                            }
                                        }).open();
                                    }}
                                    style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: '100px' }}
                                >
                                    주소 검색
                                </button>
                            </div>
                        </div>
                        <div className="col-12">
                            <label className="form-label small fw-semibold mb-2">기본 주소 <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="기본 주소"
                                value={newAddr.addr1}
                                onChange={(e) => setNewAddr({ ...newAddr, addr1: e.target.value})}
                                readOnly
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label small fw-semibold mb-2">상세 주소</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="상세 주소 (건물명, 동/호수 등)"
                                value={newAddr.addr2}
                                onChange={(e) => setNewAddr({ ...newAddr, addr2: e.target.value })}
                            />
                        </div>
                        <div className="col-12">
                            <div className="d-flex gap-2 justify-content-end mt-2">
                                <button className="btn btn-success px-4" onClick={newAddrList}>
                                    배송지 등록
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}

            {/* 배송지 목록 */}
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="mb-0">배송지 목록
                            <span className="text-muted ms-2">(총 {addrList.length}개)</span>
                            </h5>
                            {addrList.some(addr => addr.isDefault === true || addr.default === true) && (
                                <div className="mt-2">
                                    <span className="badge bg-warning text-dark">
                                        <i className="fa fa-star me-1"></i>
                                        기본 배송지로 설정된 배송지가 있습니다
                                    </span>
                                </div>
                            )}
                        </div>

                    {/* 타이틀 및 버튼 */}
                        <button className="btn btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}>
                            {showAddForm ? '추가 취소' : '배송지 추가'}
                        </button>
                    </div>

                    {/* 배송지 없을때 */}
                    {!loading && addrList.length === 0 &&(
                    <div className="alert alert-info text-center py-5">
                        등록된 배송지가 없습니다.
                    </div>
                    )}

                    {/* 배송지 목록 테이블 */}
                    {!loading && addrList.length > 0 && (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                            <tr>
                                <th style={{ width: '50px' }}>No.</th>
                                <th>배송지명</th>
                                <th>우편번호</th>
                                <th>주소</th>
                                <th>연락처</th>
                                <th style={{ width: '250px', textAlign: 'center' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                        {addrList.map((addr, index) => (
                        <tr key={addr.id}>


            {/* 수정모드가 아닐때 */}
                            {editId !== addr.id ? (
                            <>
                            <td>
                                <div className="d-flex align-items-center gap-2">
                                    <strong>{index + 1}</strong>
                                    {addr.isDefault && (
                                        <span className="badge bg-warning text-dark">
                                            <i className="fa fa-star me-1"></i>기본
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className="d-flex align-items-center gap-2">
                                    <strong>{addr.title}</strong>
                                    {(addr.isDefault === true || addr.default === true) && (
                                        <span className="badge bg-primary">
                                            <i className="fa fa-check-circle me-1"></i>기본 배송지
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td>{addr.post}</td>
                            <td>{addr.addr1}
                                {addr.addr2 && <> {addr.addr2}</>}
                            </td>
                            <td>{addr.phone}</td>
                            <td style={{ textAlign: 'center' }}>
                                <div className="d-flex gap-2 align-items-center justify-content-center">
                                    {!addr.isDefault ? (
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => setDefaultAddr(addr.id)}
                                            title="기본 배송지로 설정"
                                        >
                                            <i className="fa fa-star"></i>
                                        </button>
                                    ) : (
                                        <span className="badge bg-success text-white">기본 배송지</span>
                                    )}
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => editAddr(addr)}
                                    >
                                        수정
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => deleteAddr(addr.id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </td>
                            </>
                            ) : (
                    //  수정모드 
                            <>
                            <td>
                            <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value})}
                            />
                            </td>
                            <td>
                                <div className="d-flex gap-1">
                                    <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editForm.post}
                                    onChange={(e) => setEditForm({ ...editForm, post: e.target.value})}
                                    readOnly
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => {
                                            new window.daum.Postcode({
                                                oncomplete: function(data) {
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        post: data.zonecode,
                                                        addr1: data.address
                                                    }));
                                                }
                                            }).open();
                                        }}
                                    >
                                        검색
                                    </button>
                                </div>
                            </td>
                            <td>
                                <input
                                type="text"
                                className="form-control form-control-sm mb-1"
                                value={editForm.addr1}
                                onChange={(e) => setEditForm({ ...editForm, addr1: e.target.value})}
                                placeholder="메인 주소"
                                readOnly
                                />
                                <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editForm.addr2}
                                onChange={(e) => setEditForm({ ...editForm, addr2: e.target.value})}
                                placeholder="상세 주소"
                                />
                            </td>
                            <td>
                                <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editForm.phone}
                                onChange={(e) => setEditForm ({ ...editForm, phone: e.target.value })}
                                />
                            </td>
                            <td>
                                <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() => saveEdit(addr.id)}
                                >저장
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={cancelEdit}
                                >취소
                                </button>
                            </td>
                            </>  
                            )}
                        </tr>
                        ))}
                        </tbody>
                        </table>
                    </div>
                    )}
                </div>
                    <GotoBack /> 

            </div>
        </div>
    );
};


export default AddrList;