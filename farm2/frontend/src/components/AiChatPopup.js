import React, { useState, useEffect } from "react";
import "../styles/aiChatPopup.css";

export default function AiChatPopup({ isOpen, onClose }) {

  const [messages, setMessages] = useState([
    { from: "ai", text: "안녕하세요! 무엇을 도와드릴까요?" }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  // 추천 질문
  const exampleQuestions = [
    { title: "게시판", path: "/sns", aiText: "게시판으로 이동했어요!" },
    { title: "고객센터", path: "/contact", aiText: "고객센터로 이동했어요!" },
    { title: "마이페이지 이동", path: "/userpage", aiText: "마이페이지로 이동했어요!" }
  ];

  // 최근 문의 로드`
  useEffect(() => {
    const uid = localStorage.getItem("userId") || "guest";
    const saved = JSON.parse(localStorage.getItem(`ai-history-${uid}`) || "[]");
    setRecent(saved.slice(-3));
  }, []);

  // 최근 문의 저장
  const saveRecent = (text) => {
    const uid = localStorage.getItem("userId") || "guest";
    const key = `ai-history-${uid}`;

    const old = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [...old, text];

    localStorage.setItem(key, JSON.stringify(updated));
    setRecent(updated.slice(-3));
  };

  // 추천 질문 클릭
  const handleExampleClick = (item) => {
    window.location.href = item.path;
    setMessages(prev => [...prev, { from: "ai", text: item.aiText }]);
    saveRecent(item.title);
  };

  // 로딩 표시
  const TypingBubble = () => (
    <div className="chat-row ai">
      <div className="chat-bubble ai-bubble typing">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;

    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    saveRecent(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      setIsLoading(false);

      // AI 답변 출력
      setMessages(prev => [...prev, { from: "ai", text: data.answer }]);

      // 🔥 상담원 자동 연결
      if (data.needAgent === true) {
        if (window.ChannelIO) {
          window.ChannelIO("show");
        }
      }

    } catch {
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        { from: "ai", text: "오류가 발생했습니다. 다시 시도해주세요." }
      ]);
    }
  };

  // 상담원 버튼
  const openAgent = () => {
    if (window.ChannelIO) {
      window.ChannelIO("show");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-popup-wrapper">

      <div className="ai-popup-container">

        {/* 헤더 */}
        <div className="ai-chat-header">
          <div className="ai-header-left">AI 상담톡</div>
          <button className="connect-agent-btn" onClick={openAgent}>
            상담원 연결
          </button>
        </div>

        {/* 본문 */}
        <div className="ai-chat-body">

          {recent.length > 0 && (
            <div className="recent-box">
              <div className="recent-title">최근 문의</div>
              {recent.map((txt, idx) => (
                <div key={idx} className="recent-item">{txt}</div>
              ))}
            </div>
          )}

          <div className="ai-example-box">
            {exampleQuestions.map((item, idx) => (
              <div key={idx} className="ai-example-item" onClick={() => handleExampleClick(item)}>
                {item.title}
              </div>
            ))}
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-row ${msg.from}`}>
              <div className={`chat-bubble ${msg.from === "user" ? "user-bubble" : "ai-bubble"}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && <TypingBubble />}
        </div>

        {/* 입력창 */}
        <div className="ai-chat-input-area">
          <input
            value={input}
            placeholder="메시지를 입력하세요..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>전송</button>
        </div>
      </div>

      <button className="ai-popup-close" onClick={onClose}>✕</button>
    </div>
  );
}
