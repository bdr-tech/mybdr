"use client";

/**
 * NewPostPage — BDR v2 PostWrite 시안 적용 (Phase 4)
 *
 * 이유: 시안 `screens/PostWrite.jsx`를 그대로 따르되,
 *       form action / useActionState / createPostAction / 이미지 URL hidden input 은
 *       전부 0 변경(서버 액션·데이터 흐름 보존). UI만 v2 with-aside 2열 + 카드 폼으로 교체.
 *
 * 보존 사항:
 *   - createPostAction (formData: title, content, category, images JSON) 시그니처 그대로
 *   - useActionState 사용 패턴 그대로 (state.error / pending)
 *   - 이미지 URL 첨부 섹션 (D5) — 실 동작 그대로, 시안 톤만 가볍게 정돈
 *
 * 변경 사항:
 *   - 단독 Card → `.page > .with-aside` (좌 CommunityAsideNav + 우 main)
 *   - 카테고리 select: 4개 → 7개 (D1: recruit/qna 추가, notice 제외)
 *   - 제목+카테고리: 시안의 160px / 1fr 그리드 배치
 *   - 입력 컴포넌트: 커스텀 inp → v2 글로벌 클래스(.label/.select/.input/.textarea)
 *   - 툴바: B/I/U/S, H1/H2, 인용/목록, 사진/링크/영상, 미리보기 모두 disabled (D3)
 *   - 옵션 체크박스 3개(댓글허용/비밀글/공감표시) disabled + 글자수 카운터 (D4)
 *   - 액션 버튼: 취소 / 임시저장(disabled "준비 중") / 등록 (D2)
 */

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CommunityAsideNav } from "../_components/community-aside-nav";
import { createPostAction } from "@/app/actions/community";

// 카테고리 옵션 (D1) — DB 7개 중 notice 제외 (운영진 전용)
// CommunityAside의 BOARDS 정의와 동일한 키 사용
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "general",     label: "자유게시판" },
  { value: "recruit",     label: "팀원모집" },
  { value: "review",      label: "대회후기" },
  { value: "marketplace", label: "농구장터" },
  { value: "qna",         label: "질문답변" },
  { value: "info",        label: "정보공유" },
];

// 본문 글자수 제한 (시안 표시용 — 실 검증은 서버 액션에서 안 함)
const BODY_MAX = 20000;

export default function NewPostPage() {
  const router = useRouter();
  // 서버 액션 상태 (변경 0 — 기존 시그니처 그대로)
  const [state, formAction, pending] = useActionState(createPostAction, null);

  // 이미지 URL 목록 (최대 5장) — D5 보존
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  // 본문 글자수 카운터 — 시안 표시용
  const [bodyLen, setBodyLen] = useState(0);

  // 이미지 URL 추가 (간단한 URL 검증)
  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (imageUrls.length >= 5) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    setImageUrls((prev) => [...prev, url]);
    setImageInput("");
  };

  // 이미지 URL 삭제
  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    // 시안 .page > .with-aside — BoardList / PostDetail 와 동일 레이아웃
    <div className="page">
      <div className="with-aside">
        {/* 좌측: BoardList 와 동일한 사이드바 재사용
            글쓰기 페이지에는 활성 카테고리 개념이 없으므로 "전체글" 활성 표시 */}
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* 1. 페이지 헤더 — 시안: 좌 제목 + 우 임시저장 안내 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              글쓰기
            </h1>
            {/* D2: 임시저장 표시는 placeholder 텍스트로만 (실 자동저장 미구현) */}
            <div style={{ fontSize: 12, color: "var(--ink-dim)" }} title="임시저장 / 자동저장 준비 중">
              임시저장 · 자동저장 준비 중
            </div>
          </div>

          {/* 2. 본문 카드 — 시안 .card padding:20 */}
          <div className="card" style={{ padding: 20 }}>
            {/* 서버 액션 에러 표시 (기존 동작 그대로) */}
            {state?.error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-chip, 6px)",
                  background: "var(--color-error-light, rgba(227,27,35,0.08))",
                  color: "var(--color-error, #E31B23)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {state.error}
              </div>
            )}

            {/* form action / hidden images / pending 모두 기존 그대로 (변경 0) */}
            <form action={formAction}>
              {/* 2-1. 게시판 선택 + 제목 — 시안 160px / 1fr 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label className="label" htmlFor="post-category">게시판 선택</label>
                  <select id="post-category" name="category" className="select" defaultValue="general">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="post-title">제목</label>
                  <input
                    id="post-title"
                    name="title"
                    type="text"
                    required
                    className="input"
                    placeholder="제목을 입력하세요 (최대 80자)"
                    maxLength={80}
                  />
                </div>
              </div>

              {/* 2-2. 툴바 (D3) — 전부 disabled "준비 중"
                     시안의 .btn--sm 사용 + textarea 와 시각적으로 붙이기 위해 borderBottom:0 + radius 상단만 */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderBottom: 0,
                  borderRadius: "var(--radius-chip) var(--radius-chip) 0 0",
                  background: "var(--bg-alt)",
                  flexWrap: "wrap",
                }}
                title="에디터 툴바 준비 중"
              >
                {/* 텍스트 스타일 — 시안의 시각적 힌트(스타일 적용된 글자) 그대로 살림 */}
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ fontWeight: 800, minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>B</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ fontStyle: "italic", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>I</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ textDecoration: "underline", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>U</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ textDecoration: "line-through", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>S</button>

                {/* 구분선 */}
                <div style={{ width: 1, background: "var(--border)", margin: "4px 4px" }} />

                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>H1</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>H2</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>인용</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>목록</button>

                <div style={{ width: 1, background: "var(--border)", margin: "4px 4px" }} />

                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>image</span>
                  사진
                </button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>링크</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>영상</button>

                {/* spacer + 미리보기 */}
                <span style={{ flex: 1 }} />
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>미리보기</button>
              </div>

              {/* 2-3. 본문 textarea — 툴바와 시각적으로 연결 (상단 radius 0) */}
              <textarea
                name="content"
                required
                className="textarea"
                placeholder="내용을 입력하세요"
                onChange={(e) => setBodyLen(e.target.value.length)}
                style={{
                  minHeight: 340,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontFamily: "var(--ff-body)",
                  lineHeight: 1.7,
                }}
              />

              {/* 2-4. 옵션 체크박스 (D4) — 모두 disabled, 글자수 카운터만 실 동작 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 14,
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="댓글 허용 옵션 준비 중"
                >
                  <input type="checkbox" disabled defaultChecked /> 댓글 허용
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="비밀글 옵션 준비 중"
                >
                  <input type="checkbox" disabled /> 비밀글
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="공감 표시 옵션 준비 중"
                >
                  <input type="checkbox" disabled defaultChecked /> 공감 표시
                </label>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12 }}>
                  {bodyLen.toLocaleString()} / {BODY_MAX.toLocaleString()}자
                </span>
              </div>

              {/* 2-5. 이미지 URL 첨부 섹션 (D5) — 실 동작 보존, 톤만 정돈
                     기존 imageUrls / addImage / removeImage / hidden input 그대로 */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  이미지 첨부
                  <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500 }}>
                    URL · 최대 5장
                  </span>
                </label>

                {/* 이미 추가된 이미지 미리보기 */}
                {imageUrls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 8 }}>
                    {imageUrls.map((url, i) => (
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          width: 80,
                          height: 80,
                          overflow: "hidden",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {/* next/image 사용 — 외부 URL 도메인 next.config 화이트리스트 의존
                            기존 코드도 <img> 였고 여기서는 시안 톤만 적용. 외부 도메인 이슈 회피 위해 unoptimized 설정 */}
                        <Image
                          src={url}
                          alt={`첨부 ${i + 1}`}
                          fill
                          sizes="80px"
                          unoptimized
                          style={{ objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{
                            position: "absolute",
                            right: 2,
                            top: 2,
                            width: 20,
                            height: 20,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "50%",
                            border: 0,
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                          title="삭제"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL 입력 + 추가 버튼 */}
                {imageUrls.length < 5 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      type="url"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addImage();
                        }
                      }}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="btn btn--primary"
                      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_photo_alternate</span>
                      추가
                    </button>
                  </div>
                )}
                <p style={{ marginTop: 6, fontSize: 12, color: "var(--ink-dim)" }}>
                  {imageUrls.length}/5장 — 이미지 호스팅 URL을 입력하세요
                </p>
              </div>

              {/* hidden input: 이미지 URL 배열을 JSON 으로 직렬화해 서버 액션 전달 (변경 0) */}
              <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />

              {/* 2-6. 액션 버튼 (D2) — 취소 / 임시저장(disabled) / 등록 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                {/* 취소: 이전 페이지로 (커뮤니티 목록에서 들어왔으면 목록으로) */}
                <button
                  type="button"
                  className="btn"
                  onClick={() => router.back()}
                >
                  취소
                </button>
                {/* 임시저장: D2 — 버튼은 노출하되 disabled "준비 중" */}
                <button
                  type="button"
                  className="btn"
                  disabled
                  title="임시저장 준비 중"
                  style={{ opacity: 0.55, cursor: "not-allowed" }}
                >
                  임시저장
                </button>
                {/* 등록: 기존 submit 버튼 — pending 시 라벨 변경 */}
                <button type="submit" className="btn btn--primary" disabled={pending}>
                  {pending ? "작성 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
