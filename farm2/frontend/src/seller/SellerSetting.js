import React, { useEffect, useState } from "react";

const SellerSetting = ({ seller }) => {
    const [form, setForm] = useState({
        sellerName: "",
        phone: "",
        farmName: "",
        address: "",
        intro: "",
        businessNumber: "",
        bank: "",
        accountNumber: "",
        image: null,
        category: "",
        location: "",
        userId: "",
        nickname: ""
    });

    const [preview, setPreview] = useState(null);
    const [openLocation, setOpenLocation] = useState(false);
    const [loading, setLoading] = useState(true);

    const locations = [
        "서울가락", "서울강서", "부산엄궁", "부산국제수산", "부산반여",
        "대구북부", "인천남촌", "인천삼산", "광주각화", "광주서부",
        "대전오정", "대전노은", "수원", "안양", "안산", "구리",
        "춘천", "원주", "강릉", "청주", "충주", "천안",
        "전주", "익산", "정읍", "순천", "포항", "안동",
        "구미", "창원팔용", "울산", "창원내서", "진주"
    ];

    // ⭐ 판매자 정보 초기 세팅 (editMode 역할)
    useEffect(() => {
        if (!seller) {
            setLoading(false);
            return;
        }

        setForm({
            sellerName: seller.sellerName || "",
            phone: seller.phone || "",
            farmName: seller.farmName || "",
            address: seller.address || "",
            intro: seller.intro || "",
            businessNumber: seller.businessNumber || "",
            bank: seller.bank || "",
            accountNumber: seller.accountNumber || "",
            category: seller.category || "",
            location: seller.location || "",
            userId: seller.userId || "",
            nickname: seller.nickname || "",
            image: null
        });

        if (seller.image) {
            setPreview(`data:image/jpeg;base64,${seller.image}`);
        }
        
        setLoading(false);
    }, [seller]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    // ⭐ 판매자 정보 업데이트
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!seller?.id) {
            alert("판매자 정보를 불러오지 못했습니다.");
            return;
        }

        const formData = new FormData();
        formData.append("sellerName", form.sellerName);
        formData.append("phone", form.phone);
        formData.append("farmName", form.farmName);
        formData.append("address", form.address);
        formData.append("intro", form.intro);
        formData.append("businessNumber", form.businessNumber);
        formData.append("bank", form.bank);
        formData.append("accountNumber", form.accountNumber);
        formData.append("category", form.category);
        formData.append("location", form.location);
        formData.append("userId", form.userId);
        formData.append("nickname", form.nickname);

        if (form.image) {
            formData.append("image", form.image);
        }

        const res = await fetch(`http://localhost:8080/seller/update/${seller.id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) {
            alert("판매자 정보 수정 실패");
            return;
        }

        alert("판매자 정보가 성공적으로 수정되었습니다!");
        // 페이지 새로고침하여 최신 정보 반영
        window.location.reload();
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                fontSize: '16px',
                color: '#666'
            }}>
                판매자 정보를 불러오는 중...
            </div>
        );
    }

    if (!seller) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                fontSize: '16px',
                color: '#666'
            }}>
                판매자 정보를 찾을 수 없습니다.
            </div>
        );
    }

    return (
        <div className="container py-5" style={{ maxWidth: "900px" }}>
            <div className="card shadow-lg border-0 p-5" style={{ borderRadius: "20px" }}>
                <h4 className="text-center mb-4 fw-bold">판매자 정보 수정</h4>
                <div className="underline mx-auto mb-4"></div>
                <p className="text-center text-muted mb-4">판매자 등록 시 입력한 정보를 수정할 수 있습니다.</p>

                <form onSubmit={handleSubmit}>
                    <div className="row g-4">

                        {/* 이미지 업로드 */}
                        <div className="col-12">
                            <label className="form-label fw-bold">프로필 이미지</label>

                            <div
                                className="upload-box d-flex flex-column justify-content-center align-items-center"
                                style={{
                                    border: "2px dashed #4CAF50",
                                    borderRadius: "15px",
                                    padding: "30px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    background: "#f8fff8"
                                }}
                                onClick={() => document.getElementById("imageUpload").click()}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="preview"
                                        style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
                                    />
                                ) : (
                                    <>
                                        <i className="bi bi-image" style={{ fontSize: "40px", color: "#4CAF50" }}></i>
                                        <p className="mt-2 text-muted">이미지를 업로드하려면 클릭하세요</p>
                                    </>
                                )}
                            </div>

                            <input
                                type="file"
                                id="imageUpload"
                                style={{ display: "none" }}
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* 이름 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">이름 *</label>
                            <input
                                type="text"
                                className="form-control bg-light"
                                name="sellerName"
                                value={form.sellerName}
                                readOnly
                            />
                        </div>

                        {/* 전화번호 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">전화번호 *</label>
                            <input
                                type="text"
                                name="phone"
                                className="form-control"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 농장이름 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">농장이름 *</label>
                            <input
                                type="text"
                                name="farmName"
                                className="form-control"
                                value={form.farmName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 사업자번호 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">사업자 등록번호 *</label>
                            <input
                                type="text"
                                name="businessNumber"
                                className="form-control"
                                value={form.businessNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 품목 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">품목 *</label>
                            <select
                                className="form-select"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">선택하세요</option>
                                <option value="채소">채소</option>
                                <option value="과일">과일</option>
                                <option value="곡물&기타">곡물 & 기타</option>
                            </select>
                        </div>

                        {/* 지역 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">지역 *</label>
                            <div className="dropdown position-relative">
                                <button
                                    type="button"
                                    className="form-select text-start"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setOpenLocation(!openLocation)}
                                >
                                    {form.location || "지역 선택"}
                                </button>

                                {openLocation && (
                                    <ul
                                        className="dropdown-menu show"
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            border: "1px solid #ddd"
                                        }}
                                    >
                                        {locations.map((loc) => (
                                            <li
                                                key={loc}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setForm({ ...form, location: loc });
                                                    setOpenLocation(false);
                                                }}
                                            >
                                                {loc}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* 주소 */}
                        <div className="col-12">
                            <label className="form-label fw-bold">농장 주소 *</label>
                            <input
                                type="text"
                                className="form-control"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 은행명 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">은행명 *</label>
                            <input
                                type="text"
                                className="form-control"
                                name="bank"
                                value={form.bank}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 계좌번호 */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">계좌번호 *</label>
                            <input
                                type="text"
                                className="form-control"
                                name="accountNumber"
                                value={form.accountNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* 소개 */}
                        <div className="col-12">
                            <label className="form-label fw-bold">판매자 소개</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                name="intro"
                                value={form.intro}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 mt-4 py-3 fw-bold"
                        style={{ backgroundColor: "#4CAF50" }}
                    >
                        판매자 정보 수정하기
                    </button>
                </form>
            </div>

            <style>{`
                .underline {
                    width: 60px;
                    height: 3px;
                    background-color: #4CAF50;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default SellerSetting;
