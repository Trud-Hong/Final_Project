import React, { useEffect, useState } from "react";

const SeasonalProducts = () => {

  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/season/now")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">🍓 이번달 제철 농산물</h2>

      <div className="row g-4">
        {products.map((p) => (
          <div key={p.id} className="col-lg-3 col-md-4 col-sm-6">
            <div className="product-item border">
              <img
                src={p.mainImage ? `http://localhost:8080${p.mainImage}` : "/img/no-image.png"}
                style={{ width: "100%", height: "200px", objectFit: "cover" }}
                alt={p.name}
              />

              <div className="text-center p-3">
                <h5 className="fw-bold">{p.name}</h5>
                <span className="text-primary fw-bold">
                  {p.price.toLocaleString()}원
                </span>

                <div className="mt-2 text-secondary">
                  {p.itemType} / 제철 상품
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SeasonalProducts;
