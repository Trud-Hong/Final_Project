import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GotoBack from "../components/GotoBack";

const SellerRegister = ({ editMode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        sellerName: localStorage.getItem("username") || "",
        phone: "",
        farmName: "",
        address: "",
        intro: "",
        businessNumber: "",
        bank: "",
        accountNumber: "",
        image: null,
        imageName: "",
        category: "",  
        location: "",
        userId: localStorage.getItem("userId") || "",
        nickname: localStorage.getItem("nickname") || ""
    });

    // 판매자 정보 불러오기 (수정 모드일 때)
    useEffect(() => {
        if (editMode && id) {
            fetch(`http://localhost:8080/seller/${id}`)
                .then(res => res.json())
                .then(data => {
                    setForm({
                        sellerName: data.sellerName,
                        phone: data.phone,
                        farmName: data.farmName,
                        address: data.address,
                        intro: data.intro,
                        businessNumber: data.businessNumber,
                        bank: data.bank,
                        accountNumber: data.accountNumber,
                        image: null,
                        category: data.category,
                        location: data.location,
                        userId: data.userId,
                        nickname: data.nickname
                    });

                    if (data.image) {
                        setPreview(`data:image/jpeg;base64,${data.image}`);
                    }
                });
        }
    }, [editMode, id]);

    // 거절되었던 기존 판매자 신청 정보 불러오기
useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!userId || editMode) return;

    fetch(`http://localhost:8080/api/member/info/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(member => {
            if (!member.sellerApply) return; // 신청 기록 없음

            const apply = member.sellerApply;

            // 상태가 REJECTED 또는 PENDING일 때 자동 채움
            if (apply.status === "REJECTED" || apply.status === "PENDING") {
                setForm(prev => ({
                    ...prev,
                    phone: apply.phone || "",
                    farmName: apply.farmName || "",
                    address: apply.address || "",
                    intro: apply.intro || "",
                    businessNumber: apply.businessNumber || "",
                    bank: apply.bank || "",
                    accountNumber: apply.accountNumber || "",
                    category: apply.category || "",
                    location: apply.location || ""
                }));
            }
        })
        .catch(err => console.error("신청 정보 조회 실패:", err));
}, []);


    const locations = [
        "서울가락", "서울강서", "부산엄궁", "부산국제수산", "부산반여",
        "대구북부", "인천남촌", "인천삼산", "광주각화", "광주서부",
        "대전오정", "대전노은", "수원", "안양", "안산", "구리",
        "춘천", "원주", "강릉", "청주", "충주", "천안",
        "전주", "익산", "정읍", "순천", "포항", "안동",
        "구미", "창원팔용", "울산", "창원내서", "진주"
    ];

    const [preview, setPreview] = useState(null);
    const [openLocation, setOpenLocation] = useState(false);


    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file, imageName: file.name });
            setPreview(URL.createObjectURL(file)); // 미리보기
        }
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // 수정 모드일 때 update API 호출
    if (editMode) {
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
        formData.append("imageName", form.imageName || "");

        if (form.image) {
            formData.append("image", form.image);
            formData.append("imageName", form.image.name);
        }

        const res = await fetch(`http://localhost:8080/seller/update/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            alert("판매자 정보 수정 실패!");
            return;
        }

        alert("판매자 정보가 수정되었습니다.");
        navigate("/mypage");
        return;
    }

    // ✨ 신규 신청일 때 apply API 호출 (FormData 사용)
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
    formData.append("nickname", form.nickname);

    if (form.image) {
        formData.append("image", form.image);
    }

    const res = await fetch("http://localhost:8080/api/seller/apply", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    if (!res.ok) {
        alert("판매자 신청 실패!");
        return;
    }

    alert("판매자 신청이 접수되었습니다.\n관리자 승인 후 판매자로 활동할 수 있습니다.");
    navigate("/mypage");
};





    return (
        <div>

            <div className="container py-5" style={{ maxWidth: "900px" }}>
                <div className="card shadow-lg border-0 p-5" style={{ borderRadius: "20px" }}>

                    <h4 className="text-center mb-4 fw-bold">판매자 기본정보</h4>
                    <div className="underline mx-auto mb-4"></div>
                    <p className="text-center text-muted mb-4">판매자로 가입하기 위한 정보를 입력해주세요.</p>

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

                            <div className="col-md-6">
                                <label className="form-label fw-bold">전화번호 *</label>
                                <input type="text" className="form-control" name="phone"
                                    value={form.phone} onChange={handleChange} required />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">농장이름 *</label>
                                <input type="text" className="form-control" name="farmName"
                                    value={form.farmName} onChange={handleChange} required />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">사업자 등록번호 *</label>
                                <input type="text" className="form-control" name="businessNumber"
                                    value={form.businessNumber} onChange={handleChange} required />
                            </div>

                            {/* 품목 선택 */}
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

                            {/* 지역 선택 */}
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
                                                maxHeight: "200px",     // ⭐ 7개 정도 높이
                                                overflowY: "auto",
                                                border: "1px solid #ddd",
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



                            <div className="col-12">
                                <label className="form-label fw-bold">농장 주소 *</label>
                                <input type="text" className="form-control" name="address"
                                    value={form.address} onChange={handleChange} required />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">은행명 *</label>
                                <input type="text" className="form-control" name="bank"
                                    value={form.bank} onChange={handleChange} required />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold">계좌번호 *</label>
                                <input type="text" className="form-control" name="accountNumber"
                                    value={form.accountNumber} onChange={handleChange} required />
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-bold">판매자 소개</label>
                                <textarea className="form-control" rows="4" name="intro"
                                    value={form.intro} onChange={handleChange}></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success w-100 mt-4 py-3 fw-bold"
                            style={{ borderRadius: "12px", backgroundColor: "#4CAF50" }}
                        >
                            {editMode ? "판매자 정보 수정하기" : "판매자 신청하기"}
                        </button>

                    </form>
                </div>
            </div>

            <a href="#" className="btn btn-lg btn-success btn-lg-square rounded-circle back-to-top">
                <i className="bi bi-arrow-up"></i>
            </a>

            <style>{`
                .underline {
                    width: 60px;
                    height: 3px;
                    background-color: #4CAF50;
                    border-radius: 10px;
                }
            `}</style> <GotoBack />
        </div>
        
    );
};

export default SellerRegister;
