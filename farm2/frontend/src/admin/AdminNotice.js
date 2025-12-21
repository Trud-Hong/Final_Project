import React, { useEffect, useState } from "react";
import axios from "axios";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import Pagination from "../components/Pagination";



// 🔹 AdminReport에 쓰던 반응형 스타일 그대로 추가
const responsiveStyles = `
  @media (max-width: 768px) {
    .admin-table {
      font-size: 12px;
    }
    .admin-th, .admin-td {
      padding: 8px 4px !important;
    }
  }
  @media (max-width: 480px) {
    .admin-table {
      font-size: 11px;
    }
    .admin-th, .admin-td {
      padding: 6px 3px !important;
    }
  }
`;

export default function AdminNotice() {
  const [list, setList] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10); // 페이지당 항목 수
  const [totalPage, setTotalPage] = useState(0);

  const loginUserId = localStorage.getItem("userId"); 

  // 공지 작성/수정 공통 폼
  const [form, setForm] = useState({ id: "", title: "", content: "" });

  // 모드
  const [writeMode, setWriteMode] = useState(false); // 새 공지 작성 중인지
  const [editMode, setEditMode] = useState(false); // 기존 공지 수정 중인지

  // 작성용 에디터
  const {
    quill: writeQuill,
    quillRef: writeQuillRef,
  } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: 1 }, { header: 2 }],
        [{ size: [] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });

  // 수정용 에디터
  const {
    quill: editQuill,
    quillRef: editQuillRef,
  } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: 1 }, { header: 2 }],
        [{ size: [] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });

  // 공통 이미지 업로드 핸들러 등록 함수
  const registerImageHandler = (quillInstance) => {
    if (!quillInstance) return;

    const toolbar = quillInstance.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await axios.post(
            "http://localhost:8080/api/upload/notice-image",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          const imageUrl = res.data.url; // "/uploads/notice/xxx.jpg"
          const range = quillInstance.getSelection(true);
          quillInstance.insertEmbed(range.index, "image", imageUrl);
          quillInstance.setSelection(range.index + 1);
        } catch (err) {
          console.error(err);
          alert("이미지 업로드에 실패했습니다.");
        }
      };
    });
  };

  // 작성 에디터에 이미지 핸들러 등록
  useEffect(() => {
    if (writeQuill) {
      registerImageHandler(writeQuill);
    }
  }, [writeQuill]);

  // 수정 에디터에 이미지 핸들러 등록
  useEffect(() => {
    if (editQuill) {
      registerImageHandler(editQuill);
    }
  }, [editQuill]);

  // 공지 목록 불러오기
  const fetchNotices = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/notice/list?page=${page}&size=10&keyword=${keyword}`
      );
      setList(res.data.content);
      setTotalPage(res.data.totalPages);
      setTotalCount(res.data.totalElements);
    } catch (e) {
      console.error(e);
      alert("공지 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 에디터 내용 초기화 도우미
  const clearWriteEditor = () => {
    if (writeQuill) {
      writeQuill.setContents([]);
    }
  };

  const clearEditEditor = () => {
    if (editQuill) {
      editQuill.setContents([]);
    }
  };

  // 새 글 작성용 폼 초기화
  const initWriteForm = () => {
    setForm({ id: "", title: "", content: "" });
    clearWriteEditor();
  };

  // 전체 폼/에디터 초기화 (취소 등)
  const resetAllForm = () => {
    setForm({ id: "", title: "", content: "" });
    clearWriteEditor();
    clearEditEditor();
  };

  // 작성 모드에서 "등록" 버튼
  const handleCreate = async () => {
    if (!writeQuill) {
      alert("에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const html = writeQuill.root.innerHTML;

    if (!form.title.trim() || !html.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    const contentForSave = html.replaceAll(
      'src="http://localhost:8080/uploads',
      'src="/uploads'
    );

    try {
      await axios.post("http://localhost:8080/api/notice/write", {
        title: form.title,
        content: contentForSave,
         userId: loginUserId, 
      });

      alert("등록 완료");
      initWriteForm();
      setWriteMode(false);
      fetchNotices();
    } catch (e) {
      console.error(e);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  // 수정 모드에서 "수정 완료" 버튼
  const handleSave = async () => {
    if (!editQuill) {
      alert("에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const html = editQuill.root.innerHTML;

    if (!form.title.trim() || !html.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    const contentForSave = html.replaceAll(
      'src="http://localhost:8080/uploads',
      'src="/uploads'
    );

    try {
      await axios.put("http://localhost:8080/api/notice/update", {
        id: form.id,
        title: form.title,
        content: contentForSave,
      });

      alert("수정 완료");
      setEditMode(false);
      resetAllForm();
      fetchNotices();
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

// 수정 버튼 클릭 시
const handleEditClick = async (n) => {
  try {
    // 1. 상세 조회
    const res = await axios.get(
      `http://localhost:8080/api/notice/${n.id || n._id}`
    );
    const notice = res.data;  // { id, title, content, ... }

    console.log("edit notice detail: ", notice);

    // 2. 모드 전환
    setWriteMode(false);
    setEditMode(true);

    // 3. 폼 세팅
    setForm({
      id: notice.id,
      title: notice.title || "",
      content: notice.content || "",
    });
  } catch (e) {
    console.error(e);
    alert("공지 내용을 불러오는 중 오류가 발생했습니다.");
  }
};


  // 수정 모드 켜지고, editQuill 준비되면 내용 넣어주기
  useEffect(() => {
    if (!editMode || !editQuill) return;

    const html = (form.content || "").replaceAll(
      'src="/uploads',
      'src="http://localhost:8080/uploads'
    );

    editQuill.clipboard.dangerouslyPasteHTML(html);
  }, [editMode, editQuill, form.content]);

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/notice/delete/${id}`);
      alert("삭제 완료");
      fetchNotices();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 🔹 여기부터 레이아웃 / 스타일 (AdminReport랑 맞춰줌)
  return (
    <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <style>{responsiveStyles}</style>

      {/* 상단 바 */}
      <div
        className="admin-top-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {/* 왼쪽 : 총 몇 개 공지 */}
        <div style={{ fontSize: "14px", color: "#7f8c8d" }}>
          총 {totalCount}개 공지
        </div>

        {/* 오른쪽 : 검색 + 검색버튼 + 공지작성버튼 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-control"
            style={{ width: "260px" }}
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(0);
                fetchNotices();
              }
            }}
          />

          <button
            className="admin-btn"
            onClick={() => {
              setPage(0);
              fetchNotices();
            }}
          >
            검색
          </button>

          <button
            className="admin-btn notice-write-btn"
            onClick={() => {
              resetAllForm();
              initWriteForm();
              setWriteMode(true);
              setEditMode(false);
            }}
          >
            + 공지 작성
          </button>
        </div>
      </div>

      {/* 카드(흰 박스) */}
      <div className="admin-card">
        {/* 작성 폼 */}
        <div
          className="admin-card-body"
          style={{
            marginBottom: "25px",
            display: writeMode ? "block" : "none",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>공지 작성</h3>

          <input
            className="admin-input mb-2"
            placeholder="제목 입력"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          <div ref={writeQuillRef} style={{ height: 280, marginBottom: 20 }} />

          <button className="admin-btn mt-2" onClick={handleCreate}>
            등록
          </button>
          <button
            className="admin-btn mt-2"
            style={{ marginLeft: "10px", backgroundColor: "#7f8c8d" }}
            onClick={() => {
              resetAllForm();
              setWriteMode(false);
            }}
          >
            취소
          </button>
        </div>

        {/* 수정 폼 */}
        <div
          className="admin-card-body"
          style={{
            marginBottom: "25px",
            display: editMode ? "block" : "none",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>공지 수정</h3>

          <input
            className="admin-input mb-2"
            placeholder="제목 입력"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          <div ref={editQuillRef} style={{ height: 280, marginBottom: 20 }} />

          <button className="admin-btn mt-2" onClick={handleSave}>
            수정 완료
          </button>
          <button
            className="admin-btn mt-2"
            style={{ marginLeft: "10px", backgroundColor: "#7f8c8d" }}
            onClick={() => {
              resetAllForm();
              setEditMode(false);
            }}
          >
            취소
          </button>
        </div>

        {/* 공지 목록 테이블 - AdminReport 스타일로 변경 */}
        <div style={{ padding: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table
            className="admin-table"
            style={{ minWidth: "600px", width: "100%" }}
          >
            <thead className="admin-thead">
              <tr>
                <th className="admin-th" style={{ textAlign: "center"  }}>
                  제목
                </th>
                <th className="admin-th" style={{ minWidth: "100px", textAlign: "center" }}>
                  작성자
                </th>
                <th className="admin-th" style={{ minWidth: "120px", textAlign: "center" }}>
                  작성일
                </th>
                <th className="admin-th" style={{ minWidth: "80px", textAlign: "center" }}>
                  조회수
                </th>
                <th
                  className="admin-th"
                  style={{ minWidth: "120px", textAlign: "center" }}
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="admin-td"
                    style={{ textAlign: "center", padding: "30px" }}
                  >
                    공지 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((n) => (
                  <tr key={n.id || n._id}>
                    <td className="admin-td">{n.title}</td>

                  <td className="admin-td" style={{ textAlign: "center" }}>
                      {n.writerNickname || "-"}
                    </td>

                    <td className="admin-td">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit"
                          }).replace(/\.$/, "") // 혹시 뒤에 점이 있으면 제거
                        : "-"}

                    </td>
                    <td className="admin-td">{n.views}</td>
                    <td className="admin-td" style={{ textAlign: "center" }}>
  <a
    href="#"
    className="admin-link"
    onClick={(e) => {
      e.preventDefault();   
      handleEditClick(n);  
    }}
  >
    수정
  </a>
  <a
    href="#"
    className="admin-link admin-link-danger"
    onClick={(e) => {
      e.preventDefault();          
      handleDelete(n.id || n._id); 
    }}
  >
    삭제
  </a>
</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* 페이징 */}
          <Pagination
            page={page}
            totalPages={totalPage}
            onPageChange={setPage}
          />
    </div>
  );
}
