// 리뷰작성, 수정

import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8080";

const ReviewForm = ({
    mode,                
    order,
    existingReview,      
    userId,
    reviewContent,
    setReviewContent,
    writeReviewId,
    setWriteReviewId,
    editReviewId,
    setEditReviewId,
    myReviews,
    setMyReviews
}) => {

    const [newRating, setNewRating] = useState( existingReview?.rating || 5 );
    const [newPics, setNewPics] = useState([]);
    const newFileInputRef = useRef(null);

    const [editingRating, setEditingRating] = useState(existingReview?.rating || 5);
    const [editingPics, setEditingPics] = useState(existingReview?.pics || []);
    const [editingNewFiles, setEditingNewFiles] = useState([]);
    const editFileInputRef = useRef(null);

    const token = localStorage.getItem("token");

    const [isSaving, setIsSaving] = useState(false);

    const [savingText, setSavingText] = useState("");

    const uploadReviewImages = async (files) => {
        if (!files || files.length === 0) return [];

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("type", "review-images");

        try {
            const res = await axios.post(`${API_BASE}/files/upload`, formData, {
                headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
                },
            });

            return res.data || [];

        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
            return [];
        }
    };

    // 파일 선택
    const onNewReviewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        isNew: true,
    }));
    setNewPics((prev) => [...prev, ...previews]);
    e.target.value = "";
};

    //선택한 이미지 삭제
    const removeNewReviewPic = (idx) => {
    setNewPics((prev) => {
        const copy = [...prev];
        const remove = copy[idx];
        if (remove && remove.url)
            URL.revokeObjectURL(remove.url);
        copy.splice(idx,1);
        return copy;
        });
    };

    const handleRegisterReview = async () => {
        if (!reviewContent.trim())
            return alert("리뷰내용을 입력하세요.");
    
    try {
        const newImg = newPics.filter(p => p.file).map(p => p.file);
        let uploadedImageUrls = [];

        if (newImg.length > 0) {
            uploadedImageUrls = await uploadReviewImages(newImg);
        }

        newPics.forEach((p) => {
            if (p.url) URL.revokeObjectURL(p.url);
        });

        const body = {
            orderId: order.id,
            productId: order.productId,
            userId,
            content: reviewContent,
            product: order.pname,
            rating: newRating,
            pics: uploadedImageUrls,
        };

        await fetch("http://localhost:8080/api/myreview/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        alert("리뷰가 등록되었습니다.");

        setWriteReviewId(null);
        setReviewContent("");
        setNewRating(5);

        const res = await fetch(
            `http://localhost:8080/api/myreview/${userId}`
        );
        setMyReviews(await res.json());

    } catch (error) {
        console.error(error);
        alert("리뷰 등록 중 오류 발생");        
    }
};

    const onEditReviewFiles = (e) => {
        const files = Array.from(e.target.files || []);
        const previews = files.map((f) => ({
            file: f,
            url: URL.createObjectURL(f),
            isNew: true,
        }));

        setEditingNewFiles((prev) => [...prev, ...previews]);
        e.target.value = "";
    };

        const removeEditReviewNewPic = (idx, isExisting) => {
            if (isExisting) {
                setEditingPics((prev) => prev.filter((_, i) => i !== idx));
            } else {
                setEditingNewFiles((prev) => {
                    const copy = [...prev];
                    const removed = copy[idx];
                    if (removed.url) URL.revokeObjectURL(removed.url);
                    copy.splice(idx, 1);
                    return copy;
                });
            }
        };

    //리뷰 수정 저장
    const handlSaveEdit = async () => {
        if (!reviewContent.trim()) return alert("내용을 입력해주세요.");
        if (!editReviewId) return;

        try {
            const newImageFiles = editingNewFiles.map(f => f.file);
            let uploadedImageUrls = [];

            if (newImageFiles.length > 0) {
                uploadedImageUrls = await uploadReviewImages(newImageFiles);
            }

            editingNewFiles.forEach((f) => {
                if (f.url) URL.revokeObjectURL(f.url);
            });

            const allImageUrls = [...editingPics, ...uploadedImageUrls];

            await fetch(
                `http://localhost:8080/api/myreview/edit/${editReviewId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: reviewContent,
                        rating: editingRating,
                        pics: allImageUrls,
                    }),
                }
            );

            alert("리뷰 수정 되었습니다.");

            setEditReviewId(null);
            setReviewContent("");
            setEditingRating(5);
            setEditingPics([]);
            setEditingNewFiles([]);

            const res = await fetch(
                `http://localhost:8080/api/myreview/${userId}`
            );
            setMyReviews(await res.json());
        } catch (err) {
            console.error(err);
            alert("리뷰 수정 중 오류 발생");
        }
    };

    //수정 취소
    const cancelEdit = () => {
        editingNewFiles.forEach((f) => {
            if (f.url) URL.revokeObjectURL(f.url);
        });
        setEditReviewId(null);
        setReviewContent("");
        setEditingRating(5);
        setEditingPics([]);
        setEditingNewFiles([]);
    };

    // 렌더링 핸들러
    const currentRating = mode === "write" ? newRating : editingRating;
    const handleClickstar = (star) => {
        if (mode === "write") setNewRating(star);
        else setEditingRating(star);
    };

    // 렌더링
    return (
        <div className="p-3 mt-2 mb-3 border rounded bg-light">
            <h6>{mode === "write" ? "리뷰 작성" : "리뷰 수정"}</h6>

{/* 별점 */}
    <div className="mb-2"
        style={{ display: "flex", alignItems: "center", gap: "4px"}}>
        <span style={{ fontSize: "13px"}}>평점: </span>
        {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}
            onClick={() => handleClickstar(star)}
            style={{
                cursor: "pointer",
                fontSize: "18px",
                color: star <= currentRating ? "#ffc107" : "#ddd",
        }}>★</span>
    ))}
    </div>

    <textarea className="form-control mb-2"
    placeholder="리뷰내용을 입력하세요."
    value={reviewContent}
    onChange={(e) => setReviewContent(e.target.value)}></textarea>


{/* 사진업로드 */}
    <div className="mb-2 text-start">
        <label className="btn btn-outline-secondary btn-sm"
        style={{ fontSize: "12px",
            backgroundColor: "#3cb815",
            border: "1px solid #3cb815",
            color: "white",fontWeight: "bold",
        }}

         onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.color = "#3cb815";
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#3cb815";
                    e.target.style.color = "white";
                }}
        
        >
            사진 업로드
            <input ref={newFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onNewReviewFiles}
            style={{display: "none"}}/>
        </label>
 <div className="d-flex flex-wrap mt-2" style={{ gap: "6px" }}>
                    {/* 수정 모드: 기존 이미지 */}
                    {mode === "edit" &&
                        editingPics.map((pic, idx) => {
                            let imgUrl = pic;
                            if (!imgUrl.startsWith("http")) {
                                imgUrl = `${API_BASE}${imgUrl}`;
                            }

                            return (
                                <div
                                    key={`exist-${idx}`}
                                    style={{
                                        position: "relative",
                                        width: "50px",
                                        height: "50px",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    <img
                                        src={imgUrl}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeEditReviewNewPic(idx, true)
                                        }
                                        style={{
                                            position: "absolute",
                                            top: "-6px",
                                            right: "-6px",
                                            border: "none",
                                            backgroundColor: "#dc3545",
                                            color: "#fff",
                                            borderRadius: "50%",
                                            width: "18px",
                                            height: "18px",
                                            fontSize: "10px",
                                        }}
                                    >
                                        x
                                    </button>
                                </div>
                            );
                        })}

                    {/* 새로 추가된 이미지 (작성/수정 공통) */}
                    {(mode === "write" ? newPics : editingNewFiles).map(
                        (p, idx) => (
                            <div
                                key={`new-${idx}`}
                                style={{
                                    position: "relative",
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    border: "1px solid #ddd",
                                }}
                            >
                                <img
                                    src={p.url}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        mode === "write"
                                            ? removeNewReviewPic(idx)
                                            : removeEditReviewNewPic(idx, false)
                                    }
                                    style={{
                                        position: "absolute",
                                        top: "-6px",
                                        right: "-6px",
                                        border: "none",
                                        backgroundColor: "#dc3545",
                                        color: "#fff",
                                        borderRadius: "50%",
                                        width: "18px",
                                        height: "18px",
                                        fontSize: "10px",
                                    }}
                                >
                                    x
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* 버튼 */}
            {mode === "write" ? (
                <>
                    <button
                        className="btn btn-sm me-2"

                         style={{
                    marginLeft: "8px", 
                    fontSize: "13px", 
                    backgroundColor: "#3cb815",
                    border: "1px solid #3cb815",
                    color: "white",fontWeight: "bold",
                    transition: "color 0.15s"
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.color = "#28a745";
                }}
                onMouseLeave={(e) => {
                 e.target.style.backgroundColor = "#3cb815";
                    e.target.style.color = "white"; }}
                        
                        onClick={handleRegisterReview}
                    >
                        등록
                    </button>
                    <button
                        className="btn btn-sm"

                         style={{
                    marginLeft: "8px", 
                    fontSize: "13px", 
                    backgroundColor: "white",
                    border: "1px solid #3cb815",
                    color: "#3cb815",
                    fontWeight: "bold",
                    transition: "color 0.15s"
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#3cb815";
                    e.target.style.color = "white";
                }}
                onMouseLeave={(e) => {
                 e.target.style.backgroundColor = "white";
                    e.target.style.color = "#3cb815"; }}

                        onClick={() => {
                            setWriteReviewId(null);
                            setReviewContent("");
                            setNewPics([]);
                            newPics.forEach((p) => {
                                if (p.url) URL.revokeObjectURL(p.url);
                            });
                        }}
                    >
                        취소
                    </button>
                </>
            ) : (
                <>
                    <button
                        className="btn btn-sm me-2"

                         style={{
                    backgroundColor: "#3cb815",
                    border: "1px solid #3cb815",
                    color: "white",fontWeight: "bold",
                    transition: "color 0.15s"
                }}

                onMouseEnter={(e) => {
                 e.target.style.backgroundColor = "white";
                 e.target.style.color = "#3cb815";            }}

                onMouseLeave={(e) => {
                 e.target.style.backgroundColor = "#3cb815";
                 e.target.style.color = "white";
                 }}

                onClick={handlSaveEdit}
                >
                    수정
                </button>

                <button
                        className="btn btn-secondary btn-sm"

                         style={{
                    backgroundColor: "#ee7619",
                    border: "1px solid #ee7619",
                    color: "white",fontWeight: "bold",
                    transition: "color 0.15s"
                }}

                onMouseEnter={(e) => {
                 e.target.style.backgroundColor = "white";
                 e.target.style.color = "#ee7619";            }}

                onMouseLeave={(e) => {
                 e.target.style.backgroundColor = "#ee7619";
                 e.target.style.color = "white";
                 }}
                        
                        onClick={cancelEdit}
                    >
                        취소
                    </button>
                </>
            )}
        </div>
    );
};

export default ReviewForm;