import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTruck, FaCreditCard, FaBox, FaReceipt } from "react-icons/fa";
import { BsFillTelephoneFill } from "react-icons/bs";

const Contact = () => {
    const userId = localStorage.getItem("userId");
    
    // 폼 상태 관리
    const [formData, setFormData] = useState({
        userId: userId, // 로그인한 사용자 ID 
        category: '주문 문의',
        title: '',
        content: '',
        status: '문의 완료'
    });

    // 제출 성공/실패 메시지
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // 성공 메시지 표시 상태 (fade-in/fade-out)
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    
    // 필드별 에러 상태
    const [errors, setErrors] = useState({
        title: false,
        content: false
    });

     //카카오맵부분 추가
    useEffect(() => {
        if(!window.kakao || !window.kakao.maps){ //카카오 or 카카오맵이 준비되었으면 실행해

        console.log("카카오맵 오류");
        return; //스크립트 없으면 여기에서 종료 후 다시 점검
        }

        //HTML에서 id="kakaoMap" div 가져와
        const container = document.getElementById('KakaoMap');

        if(!container) {
            console.log("지도 컨테이너 없음");
            return;
        }

        const options = {
            center: new window.kakao.maps.LatLng(37.2635727, 127.0286009), 
            // center = 지도의 중심 위치 (임시로 수원시청 근처)
            // LatLng(위도, 경도) = 지도 좌표

            level:3  // level = 지도 확대 레벨 (1=제일 확대, 14=제일 축소)
        };

        const map = new window.kakao.maps.Map(container, options);
        //지도 만들었음.

        const geocoder = new window.kakao.maps.services.Geocoder();
        //주소를 좌표로 변경해
        
        geocoder.addressSearch('경기 수원시 팔달구 중부대로 104',
            function(result, status) {
            // addressSearch('주소', 검색완료되면실행할함수)
            // function(result, status) = 검색 끝나면 좌표정보와 결과 알려줘
        
        if (status === window.kakao.maps.services.Status.OK){
            //검색 성공했으면 실행해

            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            // result[0] = 검색 결과 첫 번째 (제일 정확한 주소)
            // y = 위도 (latitude),  x = 경도 (longitude)
            // const coords = 그 좌표를 coords라는 이름으로 저장
        
        const marker = new window.kakao.maps.Marker({
            map: map, //위에서 만든 지도에 표시해
            position: coords //검색한 좌표 위치에 마커 표시해
        });
        
        map.setCenter(coords); //마커가 화면 중앙에 있어야해.
    } else {
        console.log('주소 검색 실패:', status);
            }
        });
   },[]); //페이지 로딩시 1번 실행해
//---------------------------------------------여기까지 추가했음

    // 폼 입력 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 입력 시 해당 필드의 에러 제거
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: false
            }));
        }
    };

    // 문의 제출
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 필수 필드 검증
        let hasError = false;
        const newErrors = {
            title: false,
            content: false
        };
        
        if (!formData.title || !formData.title.trim()) {
            newErrors.title = true;
            hasError = true;
        }
        if (!formData.content || !formData.content.trim()) {
            newErrors.content = true;
            hasError = true;
        }
        
        if (hasError) {
            setErrors(newErrors);
            return;
        }

        // userId가 없으면 임시로 'guest' 사용 (실제로는 로그인 정보에서 가져와야 함)
        const submitData = {
            userId: formData.userId || 'guest',
            category: formData.category || '주문 문의',
            title: formData.title,
            content: formData.content,
            status: formData.status || '문의 완료'
        };

        try {
            const response = await axios.post(
                'http://localhost:8080/api/contact/save',
                submitData
            );
            
            // 에러 상태 초기화
            setErrors({
                title: false,
                content: false
            });
            
            // 폼 초기화
            setFormData({
                userId: userId,
                category: '주문 문의',
                title: '',
                content: '',
                status: '문의 완료'
            });

            // 성공 모달 표시 (fade-in)
            setFadeOut(false);
            setShowSuccessModal(true);
            
            // 2초 후 fade-out 시작
            setTimeout(() => {
                setFadeOut(true);
                // fade-out 애니메이션 후 모달 제거
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 500); // fade-out 애니메이션 시간
            }, 2000);
        } catch (error) {
            console.error('문의 제출 오류:', error);
            setMessage({ type: 'error', text: '문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.' });
        }
    };

    // 내 문의 조회 (사용자별 문의 목록)
    const handleViewMyContacts = async (e) => {
        e.preventDefault();
        const userId = formData.userId || 'guest';
        
        try {
            const response = await axios.get(
                `http://localhost:8080/api/contact/user/${userId}`
            );
            
            window.location.href = '/myinquire';
        } catch (error) {
            console.error('문의 조회 오류:', error);
            alert('문의 조회 중 오류가 발생했습니다.');
        }
    };


    return (
        <div>
            {/* 성공 메시지 모달 */}
            {showSuccessModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 999,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        animation: fadeOut ? 'fadeOut 0.5s ease-out forwards' : 'fadeIn 0.5s ease-in'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '40px 60px',
                            borderRadius: '15px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#28a745',
                            textAlign: 'center',
                            minWidth: '400px'
                        }}
                    >
                        문의가 성공적으로 작성되었습니다.
                    </div>
                </div>
            )}

            {/* CSS 애니메이션 스타일 */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `}</style>

            {/* Page Header Start */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{marginRight:'300px'}}>고객센터</h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/">홈페이지</a>
                            </li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">
                                고객센터
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* Page Header End */}

            {/* Contact Start */}
            <div className="container-xxl py-6">
                <div className="container">
                    {/* 타이틀 */}
                    <div
                        className="section-header text-center mx-auto mb-5 wow fadeInUp"
                        data-wow-delay="0.1s"
                        style={{ maxWidth: '600px' }}
                    >
                        <h1 className="display-5 mb-3">문의 접수</h1>
                        <p>주문, 배송, 환불 및 상품 관련 문의는 아래 고객센터로 문의해주세요.</p>
                        
                        {/* 성공 메시지만 표시 */}
                        {message.text && message.type === 'success' && (
                            <div className={`alert alert-success mt-3`} role="alert">
                                {message.text}
                            </div>
                        )}
                    </div>

                    <div className="row g-4 align-items-stretch">
                        {/* LEFT – 고객센터 정보 (파스텔 카드형) */}
                        <div className="col-lg-4 col-md-12 wow fadeInUp" data-wow-delay="0.1s">
                            <div
                                className="h-100 p-4 p-lg-5 rounded-4"
                                style={{
                                    background: '#e6f6ec',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                                }}
                            >
                                <h4 className="fw-bold mb-4"><BsFillTelephoneFill /> &nbsp; 고객센터 연락처</h4>
                                <div className="mb-4">
                                    <div className="small text-muted mb-1">대표번호</div>
                                    <div className="fs-5 fw-semibold">1588-1234</div>
                                </div>

                                <div className="mb-4">
                                    <div className="small text-muted mb-1">상담시간</div>
                                    <div>평일 09:00 ~ 18:00</div>
                                    <div>점심시간 12:00 ~ 13:00</div>
                                    <div className="small text-muted mt-1">주말·공휴일 휴무</div>
                                </div>

                                <div className="mb-4">
                                    <div className="small text-muted mb-1">이메일 문의</div>
                                    <div>farm@example.com</div>
                                </div>

                                <div className="mb-4">
                                    <div className="small text-muted mb-1">매장 위치</div>
                                    <div>수원시 인계동 휴먼IT교육</div>
                                </div>

                                <div>
                                    <div className="small text-muted mb-2">빠른 상담 채널</div>
                                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2">
                                            카카오톡 채널
                                        </span>
                                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2">
                                            이메일 상담
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT – 문의 폼 (카드형) */}
                        <div className="col-lg-8 col-md-12 wow fadeInUp" data-wow-delay="0.3s">
                            <div
                                className="bg-white rounded-4 p-4 p-lg-5 h-100"
                                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                            >
                                <h5 className="fw-bold mb-3">문의 유형</h5>
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        {/* 사용자 ID */}
                                        <input
                                            type="hidden"
                                            name="userId"
                                            value={formData.userId}
                                            onChange={handleChange}
                                        />

                                        {/* 문의 유형 */}
                                        <div className="col-12">
                                            <select 
                                                className="form-select form-select-lg"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                            >
                                                <option value="결제 오류">결제 오류</option>
                                                <option value="계정">계정</option>
                                                <option value="오류 제보">오류 제보</option>
                                                <option value="분쟁/신고">분쟁/신고</option>
                                                <option value="환불/교환">환불/교환</option>
                                                <option value="서비스 개선 요청">서비스 개선 요청</option>
                                                <option value="기타">기타</option>
                                            </select>
                                        </div>

                                        {/* 제목 */}
                                        <div className="col-md-12">
                                            {errors.title && (
                                                <div style={{ color: '#ff0019ff', fontSize: '14px', marginBottom: '5px' }}>
                                                    ※ 필수 입력 사항입니다.
                                                </div>
                                            )}
                                            <div className="form-floating">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="title"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    placeholder="제목"
                                                    style={{
                                                        borderColor: errors.title ? '#ff0019ff' : undefined,
                                                        borderWidth: errors.title ? '2px' : undefined
                                                    }}
                                                />
                                                <label htmlFor="title">제목 입력 *</label>
                                            </div>
                                        </div>

                                        {/* ID */}
                                        <div className="col-md-12">
                                            <div className="form-floating">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="userid"
                                                    placeholder="userid"
                                                    disabled
                                                />
                                                <label htmlFor="id">작성자 ID: {formData.userId}</label>
                                            </div>
                                        </div>

                                        {/* 내용 */}
                                        <div className="col-12">
                                            {errors.content && (
                                                <div style={{ color: '#ff0019ff', fontSize: '14px', marginBottom: '5px' }}>
                                                    ※ 필수 입력 사항입니다.
                                                </div>
                                            )}
                                            <div className="form-floating">
                                                <textarea
                                                    className="form-control"
                                                    id="message"
                                                    name="content"
                                                    value={formData.content}
                                                    onChange={handleChange}
                                                    placeholder="문의 내용"
                                                    style={{
                                                        height: '200px',
                                                        borderColor: errors.content ? '#ff0019ff' : undefined,
                                                        borderWidth: errors.content ? '2px' : undefined
                                                    }}
                                                    // required
                                                ></textarea>
                                                <label htmlFor="message">문의 내용 *</label>
                                            </div>
                                        </div>

                                        {/* 버튼 */}
                                        <div className="col-12 text-center mt-3 d-flex gap-3 justify-content-center">
                                            <button
                                                className="btn btn-primary"
                                                type="submit"
                                            >
                                                문의 보내기
                                            </button>
                                            <button
                                                className="btn btn-outline-primary"
                                                type="button"
                                                onClick={handleViewMyContacts}
                                            >
                                                내 문의
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Contact End */}

{/* FAQ Start */}
<div className="container-xxl py-5">
    <div className="container">

        <div
            className="section-header text-center mx-auto mb-5 wow fadeInUp"
            data-wow-delay="0.1s"
            style={{ maxWidth: "600px" }}
        >
            <h1 className="display-6 mb-3">자주 묻는 질문 (FAQ)</h1>
            <p>고객님들이 가장 자주 문의하는 내용을 정리했습니다.</p>
        </div>

        <div className="accordion" id="faqAccordion">

            {/* FAQ Item 1 */}
            <div className="accordion-item">
                <h2 className="accordion-header" id="faq1">
                    <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse1"
                    >
                        <FaTruck /> &nbsp; 배송은 얼마나 걸리나요?
                    </button>
                </h2>
                <div
                    id="collapse1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                >
                    <div className="accordion-body">
                        산지 직송 상품의 경우 지역과 날씨에 따라 다르며 보통 <strong>1~3일</strong> 이내에 도착합니다.
                    </div>
                </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="accordion-item">
                <h2 className="accordion-header" id="faq2">
                    <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse2"
                    >
                        <FaCreditCard /> &nbsp; 환불 / 교환은 어떻게 하나요?
                    </button>
                </h2>
                <div
                    id="collapse2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                >
                    <div className="accordion-body">
                        신선식품 특성상 단순 변심 환불은 불가능하며, <strong>상품 불량·오배송</strong> 시 사진과 함께 문의해주시면 처리해드립니다.
                    </div>
                </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="accordion-item">
                <h2 className="accordion-header" id="faq3">
                    <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse3"
                    >
                        <FaBox /> &nbsp; 상품이 파손되어 도착했어요.
                    </button>
                </h2>
                <div
                    id="collapse3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                >
                    <div className="accordion-body">
                        배송 중 파손된 상품은 사진을 첨부해주시면 <strong>전액 환불 또는 재배송</strong> 도와드립니다.
                    </div>
                </div>
            </div>

            {/* FAQ Item 4 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" id="faq4">
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapse4"
                                >
                                    <FaReceipt /> &nbsp; 비회원도 주문 조회가 가능한가요?
                                </button>
                            </h2>
                            <div
                                id="collapse4"
                                className="accordion-collapse collapse"
                                data-bs-parent="#faqAccordion"
                            >
                                <div className="accordion-body">
                                    비회원 주문은 주문 처리 및 배송 처리 시 문제가 발생 할 수 있으므로 <strong>회원 가입 후</strong> 이용해 주시길 바랍니다.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* FAQ End */}

            {/* --------------------------------------- */}
            {/* 혜정 11/17 카카오 맵으로 변경 */}
            <div
                className="container-xxl wow fadeIn"
                data-wow-delay="0.1s"
                style={{ marginBottom: '-6px',
                        paddingLeft: '90px',
                        paddingRight: '90px',
                        paddingBottom: '90px',
                }}
            >

                <div id="KakaoMap" style={{width: "100%", height: "450px"}}></div>
            </div>


            {/* Google Map Start */}
 {/*            <div
                className="container-xxl px-0 wow fadeIn"
                data-wow-delay="0.1s"
                style={{ marginBottom: '-6px' }}
            >
                <iframe
                    className="w-100"
                    style={{ height: '450px' }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2244.8923202031356!2d127.02631212372901!3d37.27718509925006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357b434db893bab1%3A0x3863390cf722e398!2z7Zy066i86rWQ7Jyh7IS87YSw!5e0!3m2!1sko!2skr!4v1763352251443!5m2!1sko!2skr"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="매장 위치"
                ></iframe>
            </div>
             */}
            {/* Google Map End */}

            {/* Back to Top */}
            <a
                href="#"
                className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"
            >
                <i className="bi bi-arrow-up"></i>
            </a>
        </div>
    );
};

export default Contact;
