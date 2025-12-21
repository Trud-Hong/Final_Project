import React, { useEffect, useState } from 'react';

const SmartAddressSelect = ({userId, onSelect}) => {

    const [addrList, setAddrList] = useState([]);
    const [showDirectInput, setShowDirectInput] = useState(false);
    const [directInput, setDirectInput] = useState({
        title: '',
        post: '',
        addr1: '',
        addr2: '',
        phone: ''
    });

    const API_BASE = "http://localhost:8080/api/addr";

    const fetchAllAddr = async () => {
        try {
            const res = await fetch(`${API_BASE}?userId=${userId}`);
            const data = await res.json();
            console.log('SmartAddressSelect - 불러온 배송지 원본 데이터:', data);
            
            // 정렬하지 않고 그대로 표시 (기본 배송지는 뱃지만 표시)
            setAddrList(data);
            
            // 기본 배송지가 있으면 자동으로 선택
            const defaultAddr = data.find(addr => addr.isDefault === true || addr.default === true);
            console.log('SmartAddressSelect - 찾은 기본 배송지:', defaultAddr);
            if (defaultAddr && onSelect) {
                onSelect(defaultAddr);
            }
        } catch (error) {
            console.error("주소 조회 실패", error);
        }
    }

    useEffect(() => {
        if(userId) fetchAllAddr();
    },[userId]);

    const handleDirectInputChange = (e) => {
        const { name, value } = e.target;
        setDirectInput(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDirectInputSubmit = async () => {
        // 필수 필드 확인
        if (!directInput.title || !directInput.addr1 || !directInput.phone) {
            alert('배송지 별칭, 주소, 연락처는 필수 입력 항목입니다.');
            return;
        }

        try {
            const newAddr = {
                userId: userId,
                title: directInput.title,
                post: directInput.post || '',
                addr1: directInput.addr1,
                addr2: directInput.addr2 || '',
                phone: directInput.phone
            };

            const res = await fetch(`${API_BASE}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAddr)
            });

            if (res.ok) {
                const savedAddr = await res.json();
                // 목록 새로고침
                await fetchAllAddr();
                // 선택된 주소로 설정
                onSelect(savedAddr);
                // 직접입력 폼 초기화 및 닫기
                setDirectInput({
                    title: '',
                    post: '',
                    addr1: '',
                    addr2: '',
                    phone: ''
                });
                setShowDirectInput(false);
            } else {
                alert('배송지 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error("배송지 저장 실패", error);
            alert('배송지 저장 중 오류가 발생했습니다.');
        }
    };

    return (
        <div>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <h6 className='mb-0'>배송지 선택</h6>
                <button
                    className='btn btn-outline-secondary btn-sm'
                    onClick={() => setShowDirectInput(!showDirectInput)}
                >
                    {showDirectInput ? '선택하기' : '직접입력'}
                </button>
            </div>

            {/* 직접입력 폼 */}
            {showDirectInput && (
                <div className='border rounded p-3 mb-3' style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className='mb-3'>새 배송지 등록</h6>
                    <div className='mb-2'>
                        <label className='form-label small'>배송지 별칭 <span className='text-danger'>*</span></label>
                        <input
                            type='text'
                            name='title'
                            className='form-control form-control-sm'
                            placeholder='예: 집, 회사'
                            value={directInput.title}
                            onChange={handleDirectInputChange}
                        />
                    </div>
                    <div className='mb-2'>
                        <label className='form-label small'>우편번호</label>
                        <div className='d-flex gap-2'>
                            <input
                                type='text'
                                name='post'
                                className='form-control form-control-sm'
                                placeholder='우편번호'
                                value={directInput.post}
                                onChange={handleDirectInputChange}
                                readOnly
                            />
                            <button
                                type='button'
                                className='btn btn-outline-primary btn-sm'
                                onClick={() => {
                                    new window.daum.Postcode({
                                        oncomplete: function(data) {
                                            // 우편번호와 주소 정보를 폼에 채움
                                            setDirectInput(prev => ({
                                                ...prev,
                                                post: data.zonecode,
                                                addr1: data.address
                                            }));
                                        }
                                    }).open();
                                }}
                            >
                                주소 검색
                            </button>
                        </div>
                    </div>
                    <div className='mb-2'>
                        <label className='form-label small'>기본 주소 <span className='text-danger'>*</span></label>
                        <input
                            type='text'
                            name='addr1'
                            className='form-control form-control-sm'
                            placeholder='기본 주소'
                            value={directInput.addr1}
                            onChange={handleDirectInputChange}
                            readOnly
                        />
                    </div>
                    <div className='mb-2'>
                        <label className='form-label small'>상세 주소</label>
                        <input
                            type='text'
                            name='addr2'
                            className='form-control form-control-sm'
                            placeholder='상세 주소'
                            value={directInput.addr2}
                            onChange={handleDirectInputChange}
                        />
                    </div>
                    <div className='mb-3'>
                        <label className='form-label small'>연락처 <span className='text-danger'>*</span></label>
                        <input
                            type='text'
                            name='phone'
                            className='form-control form-control-sm'
                            placeholder='010-1234-5678'
                            value={directInput.phone}
                            onChange={handleDirectInputChange}
                        />
                    </div>
                    <button
                        className='btn btn-success btn-sm w-100'
                        onClick={handleDirectInputSubmit}
                    >
                        등록하고 선택하기
                    </button>
                </div>
            )}

            {/* 등록된 배송지 목록 */}
            {!showDirectInput && (
                <>
                    {addrList.length === 0 && (
                        <div className='alert alert-info'>등록된 배송지가 없습니다.</div>
                    )}

                    {addrList.map(addr => (
                        <div
                            key={addr.id}
                            className={`border rounded p-3 mb-2 d-flex justify-content-between align-items-start ${(addr.isDefault === true || addr.default === true) ? 'border-warning' : ''}`}
                            style={{ gap: '15px', backgroundColor: (addr.isDefault === true || addr.default === true) ? '#fff3cd' : 'white' }}
                        >
                            <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                                <div className='d-flex align-items-center gap-2 mb-1'>
                                    <strong>{addr.title}</strong>
                                    {(addr.isDefault === true || addr.default === true) && (
                                        <span className="badge bg-warning text-dark">기본 배송지</span>
                                    )}
                                </div>
                                ({addr.post}) {addr.addr1}{addr.addr2 && <> {addr.addr2}</>}<br/>
                                연락처: {addr.phone}
                            </div>

                            <button
                                className='btn btn-primary btn-sm'
                                onClick={() => onSelect(addr)}
                                style={{ flexShrink: 0 }}
                            >선택</button>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default SmartAddressSelect;