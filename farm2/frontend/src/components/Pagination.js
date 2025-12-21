import React from "react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages < 1) return null;

  const jump = 5; // 한 번에 이동할 페이지 수

  const pages = Array.from({ length: totalPages }, (_, idx) => idx);

  return (
    <div className="notice-pagination">

      {/* 🔹 여러 칸 뒤로 이동 */}
      <button
        className="notice-page-btn"
        disabled={page === 0}
        onClick={() => onPageChange(Math.max(0, page - jump))}
      >
        <span>«</span>
      </button>

      {/* 🔹 한 칸 뒤로 */}
      <button
        className="notice-page-btn"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <span>‹</span>
      </button>

      {/* 🔹 페이지 번호 버튼 */}
            <span className="notice-page-indicator">
              {page + 1} / {totalPages}
            </span>

      {/* 🔹 한 칸 앞으로 */}
      <button
        className="notice-page-btn"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <span>›</span>
      </button>

      {/* 🔹 여러 칸 앞으로 이동 */}
      <button
        className="notice-page-btn"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(Math.min(totalPages - 1, page + jump))}
      >
        <span>»</span>
      </button>

    </div>
  );
}
