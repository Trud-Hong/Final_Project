import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GotoBack from "../components/GotoBack";


const MyQnA = () => {

    const [userId, setUserId] = useState("");
    const [myQna, setMyQna] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [openQnaId, setOpenQnaId] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editPrivateFlag, setEditPrivateFlag] = useState(false);

    const [savingMessage, setSavingMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false); //로딩중 애니메이션 효과

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");

        if (!storedUserId) {
            alert("로그인이 필요한 서비스입니다.");
            window.location.href = "/login";
            return
        }

        setUserId(storedUserId);
    }, []);

    // 나의 qna 불러오기
    useEffect(() => {
        if(!userId) return;

        const fetchMyQna = async () => {
            setLoading(true);

            try {
                //userId기준 QnA리스트 조회
                const res = await fetch(`http://localhost:8080/products/qna/user?userId=${userId}`);
                const data = await res.json();

                //최신순 정렬
                const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setMyQna(sorted);
            } catch (error) {
                console.error("나의 QnA조회 오류: ", error);
            }
            setLoading(false);
        };
        fetchMyQna();
    }, [userId]);    

    //날짜조회 yyyy-mm-dd
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() +1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        
        return `${year}-${month}-${day}`;
    };


    // 수정 시작
    const startEdit = (qna) => {
        if (editingId && editingId !== qna.id) {
            alert("다른 문의 수정 중입니다.");
            return;
        }

        if (qna.answer && qna.answer.trim() !== "") {
            alert("답변이 완료된 문의는 수정할 수 없습니다.");
            return;
        }

        setEditingId(qna.id);
        setEditTitle(qna.title || "");
        setEditContent(qna.content || qna.question || "");
        setEditPrivateFlag(qna.privateFlag || false);
        setOpenQnaId(qna.id);
    };

    //취소기능
    const cancelEdit = () => {
    if (!window.confirm("수정 취소하시겠습니까?")) return;

    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditPrivateFlag(false);
    setSavingMessage("");
    };

    //저장애니메이션 효과
    const showSavingAnimation = () => {
        setIsSaving(true);
        setSavingMessage("");

        const text = "수정 내용을 저장중입니다..."
        let i = 0;

        const interval = setInterval(() => {
            setSavingMessage(text.slice(0, i + 1));
            i++;
            if (i === text.length) {
                clearInterval(interval);
            }
        }, 50);
    };

    // saveEdit() 수정 저장
    const saveEdit = async () => {
        if (!editTitle.trim()) {
            alert("문의 제목을 입력해주세요");
            return;
        }

        if (!editContent.trim()) {
            alert("문의 내용을 입력해주세요");
            return;
        }

        if (!window.confirm("정말 수정하시겠습니까?")) return;

        showSavingAnimation();

    try {
        const token = localStorage.getItem("token");

        const qna = myQna.find(q => q.id === editingId);

        const res = await fetch(
        `http://localhost:8080/products/${qna.productId}/qna/${editingId}`,
        {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
        title: editTitle.trim(),
        content: editContent.trim(),
        privateFlag: editPrivateFlag
        // question: editContent,
        // content: editContent
        })
        }
        );

        if (!res.ok) {
       throw new Error("수정 실패!");
        }
        alert("수정이 완료되었습니다.");

        //상태초기화
        setEditingId(null);
        setEditTitle("");
        setEditContent("");
        setSavingMessage("");
        setEditPrivateFlag(false);
        setIsSaving(false);

        //다시불러오기
        const refreshed = await fetch(`http://localhost:8080/products/qna/user?userId=${userId}`);
        const data = await refreshed.json();
        const sorted = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMyQna(sorted);

    } catch (error) {
    console.error("수정 오류:", error);
    alert("수정 중 오류가 발생했습니다.");
    setIsSaving(false);
    setSavingMessage("");
    }
    };

    //QnA 삭제 기능
    const deleteQna = async (qna) => {

        if (qna.answer && qna.answer.trim() !== "") {
            alert("답변이 완료된 문의는 삭제할 수 없습니다.");
            return;
        }

        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`http://localhost:8080/products/${qna.productId}/qna/${qna.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization" : `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("삭제 되었습니다.");

                setMyQna(myQna.filter(q => q.id !== qna.id));

                if (openQnaId === qna.id) {
                    setOpenQnaId(null); }
            } else {
                throw new Error("삭제 실패!");
            }
        } catch (error) {
            console.error("삭제 오류:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const toggleContent = (qnaId) => {
        setOpenQnaId(openQnaId === qnaId ? null : qnaId);
    };

    return (
        <div className="container mt-5" style={{marginBottom: "80px"}}>

            {/* 페이지 제목 */}
            <h1 className="display-5 mb-4">나의 QnA</h1>
            <hr style={{ borderTop: "2px solid #ddd"}} />

            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">로딩중...</span>
                    </div>
                </div>
            )}

            {!loading && myQna.length === 0 && (
                <div className="alert alert-info text-center py-5">
                    <i className="fa fa-comment fa-3x mb-3 d-block text-muted"></i>
                    작성한 문의가 없습니다.
                </div>
            )}

            {!loading && myQna.length > 0 && (
                <div>

                    <div className="row bg-light py-3 mb-2 rounded fw-bold text-center" style={{fontSize: "14px"}}>
                        <div className="col-1">No.</div>
                        <div className="col-1">답변상태</div>
                        <div className="col-2">상품명</div>
                        <div className="col-3">제목</div>
                        <div className="col-1">비밀글</div>
                        <div className="col-2">작성일</div>
                        <div className="col-2">관리</div>
                    </div>

                {myQna.map((qna, index) => {
                    const isEditing = editingId === qna.id;
                    const isOpen = openQnaId === qna.id;
                    const hasAnswer = qna.answer && qna.answer.trim() !== "";

                    return (
                        <div key={qna.id} className="mb-2">

                            <div className="row bg-white p-3 rounded shadow-sm align-items-center text-center" style={{ fontSize: "13px" }}>

{/* no */}
                        <div className="col-1">
                            <strong>{index + 1}</strong>
                        </div>

    {/* 답변여부 */}
                    <div className="col-1">
                        <strong style={{ color: hasAnswer ? "#3cb815" : "#ee7619" }}>
                                {hasAnswer ? "답변완료" : "미답변"}
                            </strong>
                    </div>

    {/* 상품명 */}
                <div className="col-2"> 
                    <strong style={{ cursor: "pointer", color: "#333" }}
                        onClick={() => navigate(`/products/detail/${qna.productId}`)}
                        
                        onMouseEnter={(e) => {
                        e.target.style.color = "#3cb815";
                        e.target.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                        e.target.style.color = "#333";
                        e.target.style.textDecoration = "none";
                        }}

                    > {qna.productName}</strong>
                </div>

{/* 제목 */}

                <div className="col-3">
                    <span
                        style={{
                                cursor: "pointer",
                                color: "#555",
                                fontSize: "13px",
                                marginTop: "3px",
                            }}
                            onClick={() => toggleContent(qna.id)}
                            
                            onMouseEnter={(e) => {
                            e.target.style.color = "#3cb815";
                            e.target.style.textDecoration = "underline"; }}

                        onMouseLeave={(e) => {
                            e.target.style.color = "#555";
                            e.target.style.textDecoration = "none"; }}
                            
                            > {qna.title || qna.content || qna.question}
                        
                    </span>
                </div>

    {/* 비밀글 여부 */}
                <div className="col-1">
                    {qna.privateFlag ? (
                        <span className="badge bg-secondary">비밀글</span>
                    ) : (
                        <span className="text-muted">공개</span>
                    )}
                </div>

            {/* 작성일 */}
                <div className="col-2">
                    <strong>{formatDate(qna.createdAt)}</strong>
                </div>

                {/* 내용보기  */}
                <div className="col-2 d-flex justify-content-center" style={{ gap: "5px" }}>
                <button 
                className="btn btn-sm btn-outline-success"
                style={{ fontSize: "11px", padding: "3px 8px" }}
                onClick={() => toggleContent(qna.id)}>
                        {isOpen ? "접기" : "내용보기"}
                    </button>

         
</div>
</div>

            {isOpen && (
                 <>
 <hr style={{ borderTop: "1px solid #9c9c9cff", margin: "20px 0" }} />
 {/* 구분선 */}


                <div className="bg-light p-4 rounded shadow-sm mt-2">

            {isEditing ? (
                <div>
                    {/* 저장중 애니메이션 */}
                    {isSaving && savingMessage && (
                        <p className="text-success mb-3">
                            <strong>{savingMessage}</strong>
                        </p>
                    )}

            {/* 제목입력 */}
            <div className="row">
                <div className="col-2">
                <label className="form-label fw-bold">제목</label></div>

                 <div className="col-8">
                <input type="text" className="form-control"
                value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목을 입력하세요."
                disabled={isSaving}/>
                </div>


                 <div className="col-2">
      {/* 비공개 체크박스 */}
        <div className="d-flex align-items-center justify-content-between">
            <div className="form-check">
                <input 
                    className="form-check-input"
                    type="checkbox" 
                    id={`privateCheck-${qna.id}`}
                    checked={editPrivateFlag}
                    onChange={(e) => setEditPrivateFlag(e.target.checked)}
                    disabled={isSaving} 
                />
                <label 
                    className="form-check-label" 
                    htmlFor={`privateCheck-${qna.id}`}
                >
                    비공개
                </label>
            </div>
</div>
</div>

            
<p></p>
            <div className="col-2 mb-3">
                <label className="form-label fw-bold">내용</label>
                <p style={{marginTop: "30px", marginLeft: "30px"}}>   {/* 저장, 취소 버튼 */}
             <div className="d-flex" style={{gap: "10px"}}>
                <button 
                    className="btn btn-success btn-sm"
                    onClick={saveEdit} 
                    disabled={isSaving}
                >
                    저장
                </button>
                <button 
                    className="btn btn-secondary btn-sm"
                    onClick={cancelEdit}
                    disabled={isSaving}
                >
                    취소
                </button>
            </div>
 </p>
                
                
                
                </div>
            
            <div className="col-9">
                <textarea className="form-control"
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="내용을 입력하세요."
                disabled={isSaving} />
            </div>

        </div>
    </div>

    ) : (

        <div className="row">

            <div className="col-2"
            style={{ fontSize: "15px" , fontWeight: "bold"
                ,textAlign: "left",  alignItems: "center"
            }}>
                <strong
                style={{ marginLeft: "8px"}}>문의내용
                </strong>
            </div>          

        <div className="col-8 p-3 mb-3 rounded shadow-sm"
             style={{ marginLeft: "-50px",
              textAlign: "center", fontSize: "14px"
              , alignItems: "center",
              background: "white", border: "1px solid #ddd", lineHeight: "1.6"
              }}>
            {qna.content || qna.question}
        </div>



        <div className="col-2"
        style={{ alignItems: "center"}}>
        {!hasAnswer && (
       <>
        <button 
            className="btn btn-sm btn-warning"
            style={{fontSize: "11px", padding: "3px 8px" }}
            onClick={() => startEdit(qna)}
        >
            수정
        </button>
        <button 
            className="btn btn-sm btn-danger"
            style={{ marginLeft:"4px",
                 fontSize: "11px", padding: "3px 8px" }}
            onClick={() => deleteQna(qna)}
        >
            삭제
        </button>
        </>
    )} 
</div>


        {hasAnswer ? (
           <> 
        <div className="col-2 "
        style={{ textAlign: "left", alignItems: "center"}}>

        <strong style={{ fontSize: "15px", color: "#3cb815" }}>관리자 답변</strong>
        </div>

        <div className="col-8 p-3 rounded shadow-sm"
            style={{ marginLeft: "-50px", textAlign: "center",  alignItems: "center", fontSize: "14px", lineHeight: "1.6",
                background: "white", border: "1px solid #3cb815"
            }}>
            {qna.answer}
        </div>

        <div className="col-2 d-flex flex-column align-items-end justify-content-start"
        style={{ alignItems: "center"}}>
                {qna.answeredAt && (
                    <div className="text-muted small">
                       답변일<br/>{formatDate(qna.answeredAt)}
                    </div>
                )}
        </div>




        <div className="alert alert-secondary small mt-3" style={{ textAlign: "center" }}>
            답변이 완료된 문의는 수정 및 삭제가 불가능합니다.
            </div>
            </>       
  
) : (
          
            <p 
            style={{marginTop: "20px", border: "1px solid #3cb815",
        color: "#3cb815",
        padding: "12px 12px",
        borderRadius: "8px",
        textAlign: "center",
        fontSize: "14px",}}>아직 답변이 작성되지 않았습니다.</p>
        )}

        
        </div>
    )}
    </div>
    
    </>
                )}
     

    </div>
                        );
                    })}
                </div>
            )}
              <GotoBack />
        </div>
    );
};
export default MyQnA;