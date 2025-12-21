import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/productDetailPage.scss';
import '../css/relatedProduct.scss';
import { getDiscountedPrice, isOnDiscount } from '../utils/priceCalculator';

const formatPrice = (v) => (typeof v === "number" ? `${v.toLocaleString()}원` : v);

const RelatedProducts = ({ products = [] }) => {
  const navigate = useNavigate();

  const onRelatedClick = (id) => {
    navigate(`/products/detail/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="pd-related">
      <h4>함께 보면 좋은 상품</h4>
      <div className="pd-related-row">
        {products.map((p) => (
          <div key={p.id} className="pd-related-card" onClick={() => onRelatedClick(p.id)}>
            <img src={p.images?.[0]} alt={p.name} />
            <div className="r-info">
              <div className="r-name">{p.name}</div>
              {p.discountRate && isOnDiscount(p.discountRate, p.discountStart, p.discountEnd) ? (
                <div className='r-price-row'>
                  <div className='r-discount'>{p.discountRate}%</div>
                  <div className='r-price'>
                    {formatPrice(getDiscountedPrice(p.price, p.discountRate, p.discountStart, p.discountEnd))}
                    <div className='r-price-old'>{formatPrice(p.price)}</div>
                  </div>
                </div>
              ) : (
                <div className="r-price">{formatPrice(p.price)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;

