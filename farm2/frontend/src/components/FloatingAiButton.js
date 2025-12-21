import React from "react";
import "../styles/aiFloatingButton.css";

export default function FloatingAiButton({ onClick }) {
  return (
    <button className="floating-ai-btn" onClick={onClick}>
       <img src="/img/ChatGPT.png" alt="AI Chat" style={{ width: "87px" }} />
    </button>
  );
}

