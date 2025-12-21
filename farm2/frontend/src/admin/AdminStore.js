import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminStore.css";

const AdminStore = () => {

    /* ------------------- 판매자 목록 ------------------- */
    const [sellerList, setSellerList] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/seller/list")
            .then(res => res.json())
            .then(data => setSellerList(data))
            .catch(err => console.error(err));
    }, []);

    /* ------------------- 추천가게 목록 ------------------- */
    const [stores, setStores] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8080/api/stores/recommend")
            .then(res => setStores(res.data))
            .catch(err => console.error(err));
    }, []);

    /* ------------------- Form ------------------- */
    const [form, setForm] = useState({
        sellerId: "",
        sellerName: "",
        farmName: "",
        category: "",
        location: "",
        address: "",
        intro: "",
        imageUrl: "",
        startDate: "",
        phone: ""
    });

    const [editingId, setEditingId] = useState(null);

    /* ------------------- 판매자 선택 자동입력 ------------------- */
    const handleSelectSeller = (e) => {

        
        const seller = sellerList.find(s => s.id === e.target.value);
        if (!seller) return;

        setForm({
            sellerId: seller.id,
            sellerName: seller.sellerName,
            farmName: seller.farmName,
            category: seller.category,
            location: seller.location,
            address: seller.address,
            intro: seller.intro,
            imageUrl: seller.image ? `data:image/jpeg;base64,${seller.image}` : "/img/no-image.png",
            startDate: new Date().toISOString().slice(0, 10),
            phone: seller.phone
        });
    };

    /* ------------------- onChange ------------------- */
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    /* ------------------- 추가 ------------------- */
    const handleAdd = () => {

        const isDuplicate = stores.some(s => s.sellerId === form.sellerId);
        if (isDuplicate) {
            alert("이미 추천 가게 목록에 등록된 판매자입니다.");
            return;
        }

        axios.post("http://localhost:8080/api/stores/recommend", form)
            .then(res => {
                setStores([...stores, res.data]);
                resetForm();
            })
            .catch(err => console.error(err));
    };

    const resetForm = () => {
        setForm({
            sellerId: "",
            sellerName: "",
            farmName: "",
            category: "",
            location: "",
            address: "",
            intro: "",
            imageUrl: "",
            startDate: "",
            phone: ""
        });
    };

    /* ------------------- 수정 ------------------- */
    const startEdit = (store) => {
        setEditingId(store.id);
        setForm({ ...store });
    };

    const endEdit = () => {
        setEditingId(null);
        resetForm();
    }

    const handleUpdate = () => {
        axios.put(`http://localhost:8080/api/stores/recommend/${editingId}`, form)
            .then(res => {
                setStores(stores.map(s => s.id === editingId ? res.data : s));
                setEditingId(null);
                resetForm();
            })
            .catch(err => console.error(err));
    };

    /* ------------------- 삭제 ------------------- */
    const handleDelete = (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        axios.delete(`http://localhost:8080/api/stores/recommend/${id}`)
            .then(() => {
                setStores(stores.filter(s => s.id !== id));
            })
            .catch(err => console.error(err));
    };

    const moveUp = (id) => {
        axios.put(`http://localhost:8080/api/stores/recommend/${id}/move-up`)
            .then(() => {
                // 다시 목록 불러오기
                return axios.get("http://localhost:8080/api/stores/recommend");
            })
            .then(res => setStores(res.data));
    };

    const moveDown = (id) => {
        axios.put(`http://localhost:8080/api/stores/recommend/${id}/move-down`)
            .then(() => {
                return axios.get("http://localhost:8080/api/stores/recommend");
            })
            .then(res => setStores(res.data));
    };

    /* ------------------- UI ------------------- */
    // 이미 등록된 판매자 ID 목록 추출
    const registeredSellerIds = stores.map(s => s.sellerId);
    
    // 등록되지 않은 판매자만 필터링 (추가 모드일 때만)
    const availableSellers = editingId 
        ? sellerList  // 수정 모드일 때는 모든 판매자 표시
        : sellerList.filter(s => !registeredSellerIds.includes(s.id));  // 추가 모드일 때는 미등록 판매자만 표시

    return (
        <div className="admin-store-container">

            {/* 추천가게 등록 폼 */}
            <div className="admin-store-form">

    <h4>추천 가게 등록 / 수정</h4>

    <select className="form-control mb-3" onChange={handleSelectSeller} value={form.sellerId || ""}>
        <option value="">판매자를 선택하세요</option>
        {availableSellers.map(s => (
            <option key={s.id} value={s.id}>
                {s.farmName} ({s.sellerName})
            </option>
        ))}
    </select>

    {/* 상단 3열 그리드 */}
    <div className="form-grid">

        <div className="form-item">
            <label>농장명</label>
            <input className="form-control" name="farmName" value={form.farmName} onChange={handleChange} />
        </div>

        <div className="form-item">
            <label>판매자 이름</label>
            <input className="form-control" name="sellerName" value={form.sellerName} onChange={handleChange} />
        </div>

        <div className="form-item">
            <label>연락처</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-item">
            <label>판매자 품목</label>
            <input className="form-control" name="category" value={form.category} onChange={handleChange} />
        </div>

        <div className="form-item">
            <label>판매 등록일</label>
            <input type="date" className="form-control" name="startDate" value={form.startDate} onChange={handleChange} />
        </div>

        <div className="form-item">
            <label>시장 위치</label>
            <input className="form-control" name="location" value={form.location} onChange={handleChange} />
        </div>

        <div className="form-item-full">
            <label>주소</label>
            <input className="form-control" name="address" value={form.address} onChange={handleChange} />
        </div>
    </div>

    {/* 이미지 + 소개글 */}
    <div className="profile-box">
        {form.imageUrl && (
            <div className="profile-img">
                <img src={form.imageUrl} alt="판매자 이미지가 없습니다." />
            </div>
        )}

        <div className="profile-intro">
            <label>소개글</label>
            <textarea className="form-control" name="intro" value={form.intro} onChange={handleChange} />
        </div>
    </div>

    {editingId ? (
        <div className="justify-content-center" style={{ display: 'flex', gap: '10px' }}>
            <button
                className="btn btn-outline-primary"
                style={{ marginTop: '25px'}}
                onClick={endEdit}
            >
                취소
            </button>
            <button
                className="btn btn-primary"
                style={{ marginTop: '25px'}}
                onClick={handleUpdate}
            >
                추천가게 변경저장
            </button>
        </div>
    ) : ( 
        <button 
            className="btn btn-primary" 
            style={{marginBottom: "30px", marginTop: '25px'}} 
            onClick={handleAdd}
        >
            추천가게 등록하기
        </button> 
    )}
</div>


            {/* 추천 목록 */}
<div className="admin-store-table">

    <h4>추천 가게 목록</h4>

    <div className="table-responsive">
        <table className="recommend-table">
            <thead>
                <tr>
                    <th>이미지</th>
                    <th>농장명</th>
                    <th>판매자</th>
                    <th>품목</th>
                    <th>시장</th>
                    <th>연락처</th>
                    <th>관리</th>
                </tr>
            </thead>

            <tbody>
                {stores.map((s) => (
                    <tr key={s.id}>
                        <td>
                            <img 
                                src={s.imageUrl} 
                                alt="store" 
                                className="store-img"
                            />
                        </td>
                        <td>{s.farmName}</td>
                        <td>{s.sellerName}</td>
                        <td>{s.category}</td>
                        <td>{s.location}</td>
                        <td>{s.phone}</td>


                        <td className="action-cell">
    <div className="action-wrapper">

        {/* 수정 + 삭제 = 가로 정렬 */}
        <div className="edit-delete-group">
            <button className="table-btn btn-edit" onClick={() => startEdit(s)}>수정</button>
            <button className="table-btn btn-delete" onClick={() => handleDelete(s.id)}>삭제</button>
        </div>

        {/* 화살표 = 세로 정렬 */}
        <div className="arrow-group">
            <button className="table-btn btn-arrow" onClick={() => moveUp(s.id)}>▲</button>
            <button className="table-btn btn-arrow" onClick={() => moveDown(s.id)}>▼</button>
        </div>

    </div>
</td>

                    </tr>
                ))}
            </tbody>
        </table>
    </div>

</div>


        </div>
    );
};

export default AdminStore;
