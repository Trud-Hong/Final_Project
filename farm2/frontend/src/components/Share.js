import React, { useState } from 'react';
import { FaShareAlt } from "react-icons/fa";

const Share = () => {
    const [isHovered, setIsHovered] = useState(false);

    // 공유하기
    const sharePost = async () => {
        const url = window.location.href;
        
        try {
            // Clipboard API가 사용 가능한 경우
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                alert("상품 링크가 복사되었습니다!");
            } else {
                // Fallback: 구식 방법 사용
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        alert("상품 링크가 복사되었습니다!");
                    } else {
                        // 복사 실패 시 사용자에게 수동 복사 안내
                        prompt("링크를 복사하세요:", url);
                    }
                } catch (err) {
                    console.error('Fallback 복사 실패:', err);
                    prompt("링크를 복사하세요:", url);
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
            // 에러 발생 시 사용자에게 수동 복사 안내
            prompt("링크를 복사하세요:", url);
        }
    };

    const buttonStyle = {
        position: "fixed",
        bottom: "50px",
        left: "50px",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        border: "1px solid #e0e0e0",
        backgroundColor: "#ffffff",
        cursor: "pointer",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isHovered 
            ? "0 4px 12px rgba(0, 0, 0, 0.15)" 
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
    };

    const iconStyle = {
        width: "24px",
        height: "24px",
        color: "#333333",
        transition: "color 0.3s ease",
    };

    return (
        <div 
            style={buttonStyle}
            onClick={sharePost}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="공유하기"
        >
            <FaShareAlt style={iconStyle} />
        </div>
    );
};

export default Share;