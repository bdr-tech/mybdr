"use client";

/**
 * CommunityAside — 커뮤니티 좌측 게시판 그룹 트리 (BDR v2 시안)
 *
 * 이유: BDR v2 시안 `components.jsx`의 `<Sidebar>` 패턴을 그대로 적용.
 *       DB 카테고리 7개를 시안의 3그룹(메인/플레이/이야기)으로 재배치한다.
 *
 * CSS 의존: `.aside`, `.aside__group`, `.aside__title`, `.aside__link`, `.aside__divider`, `.btn--primary`, `.badge--new`
 *           모두 globals.css에 정의됨.
 *
 * 동작: 활성 카테고리 표시 + 클릭 시 onSelect 콜백 호출. 부모가 router.push로 URL 동기화.
 *       글쓰기 버튼은 Link로 /community/new 이동.
 *
 * 게시글 수: DB에 카테고리별 글 수 집계 API가 없으므로 "—" 표시 + title="준비 중" 툴팁.
 *           (추후 구현: API 도입 후 props로 count 주입)
 */

import Link from "next/link";

// 카테고리 그룹 정의 — PM 결정 (메인/플레이/이야기 3그룹)
// DB key는 community-content.tsx의 categoryMap과 일치해야 함
type GroupKey = "main" | "play" | "chat";

interface BoardItem {
  id: string | null; // null = "전체"
  name: string;
  group: GroupKey;
}

// 시안의 BOARDS 패턴을 그대로 따르되, DB 카테고리 7개로 매핑
const BOARDS: BoardItem[] = [
  // 메인
  { id: null,          name: "전체글",    group: "main" },
  { id: "notice",      name: "공지사항",  group: "main" },
  { id: "general",     name: "자유게시판", group: "main" },
  // 플레이
  { id: "recruit",     name: "팀원모집",  group: "play" },
  { id: "review",      name: "대회후기",  group: "play" },
  { id: "marketplace", name: "농구장터",  group: "play" },
  // 이야기
  { id: "qna",         name: "질문답변",  group: "chat" },
  { id: "info",        name: "정보공유",  group: "chat" },
];

const GROUP_LABEL: Record<GroupKey, string> = {
  main: "메인",
  play: "플레이",
  chat: "이야기",
};

interface CommunityAsideProps {
  // 현재 활성 카테고리 (URL ?category=...). 비어있으면 "전체글" 활성
  activeCategory: string | null;
  // 카테고리 클릭 핸들러 — null = 전체
  onSelect: (categoryKey: string | null) => void;
}

export function CommunityAside({ activeCategory, onSelect }: CommunityAsideProps) {
  // 그룹 순서 고정: 메인 → 플레이 → 이야기
  const groupKeys: GroupKey[] = ["main", "play", "chat"];

  return (
    <aside className="aside">
      {/* 글쓰기 버튼 — 시안 그대로 상단 고정 */}
      <div className="aside__group">
        <Link
          href="/community/new"
          className="btn btn--primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          글쓰기
        </Link>
      </div>
      <div className="aside__divider" />

      {/* 그룹별 게시판 목록 */}
      {groupKeys.map((g) => {
        const items = BOARDS.filter((b) => b.group === g);
        return (
          <div key={g} className="aside__group">
            <div className="aside__title">{GROUP_LABEL[g]}</div>
            {items.map((b) => {
              // 활성 판정: id가 null인 항목은 activeCategory가 null/빈값일 때
              const isActive = b.id === null ? !activeCategory : activeCategory === b.id;
              return (
                <a
                  key={b.id ?? "all"}
                  className="aside__link"
                  data-active={isActive}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(b.id);
                  }}
                  href="#"
                >
                  <span>{b.name}</span>
                  {/* 게시글 수: DB 집계 API 미존재 → "—" + 준비 중 툴팁 */}
                  <span className="count" title="준비 중">—</span>
                </a>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
