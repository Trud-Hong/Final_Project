// src/pages/seller/SellerProductCreate.jsx
import React, { useState } from 'react';

const SellerProductCreate = () => {
  const [category, setCategory] = useState('VEGETABLE'); // VEGETABLE, FRUIT, GRAIN, ETC
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [description, setDescription] = useState('');

  const [options, setOptions] = useState([
    { color: '', size: '' }
  ]);

  const [mainImage, setMainImage] = useState(null);
  const [detailImages, setDetailImages] = useState([]);

  const handleOptionChange = (index, field, value) => {
    setOptions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddOption = () => {
    setOptions(prev => [...prev, { color: '', size: '' }]);
  };

  const handleRemoveOption = (index) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    setMainImage(file || null);
  };

  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setDetailImages(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // FormData로 서버 전송할 예시
    const formData = new FormData();
    formData.append('category', category);
    formData.append('name', name);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('shippingFee', shippingFee);
    formData.append('description', description);
    formData.append('options', JSON.stringify(options));

    if (mainImage) {
      formData.append('mainImage', mainImage);
    }
    detailImages.forEach((file, idx) => {
      formData.append('detailImages', file);
    });

    // TODO: axios.post('/api/seller/product', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    alert('상품 등록 요청(더미) — 실제로는 API 호출을 붙이면 됩니다.');
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 style={{ margin: 0 }}>상품 등록</h3>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
        {/* 카테고리 */}
        <label className="admin-label">카테고리</label>
        <select
          className="admin-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="VEGETABLE">채소</option>
          <option value="FRUIT">과일</option>
          <option value="GRAIN">곡물</option>
          <option value="ETC">기타</option>
        </select>

        {/* 상품명 */}
        <label className="admin-label">상품명</label>
        <input
          className="admin-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 수원 배추 1kg"
          required
        />

        {/* 가격 / 재고 */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label className="admin-label">가격</label>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예) 3500"
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label className="admin-label">재고</label>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="예) 10"
              required
            />
          </div>
        </div>

        {/* 옵션 등록 */}
        <label className="admin-label" style={{ marginTop: '15px' }}>옵션(색상/사이즈 등)</label>
        {options.map((opt, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input
              className="admin-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="색상 (예: 빨강)"
              value={opt.color}
              onChange={(e) => handleOptionChange(index, 'color', e.target.value)}
            />
            <input
              className="admin-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="사이즈 (예: 대, 소)"
              value={opt.size}
              onChange={(e) => handleOptionChange(index, 'size', e.target.value)}
            />
            {options.length > 1 && (
              <button
                type="button"
                className="admin-btn-delete"
                onClick={() => handleRemoveOption(index)}
              >
                X
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-secondary"
          onClick={handleAddOption}
        >
          옵션 추가
        </button>

        {/* 이미지 업로드 */}
        <label className="admin-label" style={{ marginTop: '20px' }}>대표 이미지</label>
        <input
          className="admin-input"
          type="file"
          accept="image/*"
          onChange={handleMainImageChange}
        />
        {mainImage && (
          <p style={{ fontSize: '12px', color: '#555' }}>선택된 파일: {mainImage.name}</p>
        )}

        <label className="admin-label">상세 이미지 (여러 장 선택 가능)</label>
        <input
          className="admin-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleDetailImagesChange}
        />
        {detailImages.length > 0 && (
          <p style={{ fontSize: '12px', color: '#555' }}>
            선택된 파일 {detailImages.length}개
          </p>
        )}

        {/* 배송비 */}
        <label className="admin-label" style={{ marginTop: '15px' }}>배송비 설정</label>
        <input
          className="admin-input"
          type="number"
          min="0"
          value={shippingFee}
          onChange={(e) => setShippingFee(e.target.value)}
          placeholder="예) 3000 (0이면 무료배송)"
        />

        {/* 상품 설명 */}
        <label className="admin-label" style={{ marginTop: '15px' }}>상품 설명</label>
        <textarea
          className="admin-input"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품의 특징, 산지, 수확일, 보관 방법 등을 적어주세요."
        />

        <button
          type="submit"
          className="admin-btn-primary"
          style={{ marginTop: '20px' }}
        >
          상품 등록하기
        </button>
      </form>
    </div>
  );
};

export default SellerProductCreate;
