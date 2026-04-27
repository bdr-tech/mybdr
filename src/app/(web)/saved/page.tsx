/* ============================================================
 * /saved — 보관함 (Saved/Bookmarks) v2 신규
 *
 * 왜 서버 컴포넌트로:
 * - PM 결정(D-옵션 C, 7탭 분리): API/Prisma 0 변경. 기존 모델만 사용.
 *   웹세션 인증은 getWebSession() 표준 패턴, BigInt 변환은 페이지에서 처리.
 * - 비로그인 → 로그인 유도 카드(profile 페이지와 동일 UX). redirect 대신 인라인 표시(검색엔진/공유 시 깨짐 방지).
 *
 * 데이터 소스 (현재 DB에 존재하는 2 모델):
 *   1) board_favorites          — 즐겨찾는 게시판(카테고리 슬러그) 목록
 *   2) user_favorite_courts     — 즐겨찾는 코트 (자주 가는 코트 + last_used_at)
 *
 * 미지원 5탭(게시글/경기/대회/팀):
 *   - DB에 community_post_bookmarks / game_bookmarks / tournament_bookmarks / team_follows 모델 없음.
 *   - 현재는 빈 배열로 내려보내고 클라이언트가 "북마크 시스템 준비 중" 안내 카드 표시.
 *   - scratchpad "🚧 Phase 5 Saved" 6건에 추후 구현 항목 기록.
 *
 * 보안:
 *   - 세션 userId 기반 본인 데이터만 조회. IDOR 없음.
 *   - BigInt → string, Date → ISO 변환 모두 페이지에서 수행 (클라이언트는 직렬화 가능 형태만 받음).
 * ============================================================ */

import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

import { SavedContent, type SavedBoard, type SavedCourt } from "./_v2/saved-content";

// 본인 데이터 매 요청 최신화 — 캐시 금지
export const dynamic = "force-dynamic";

// 게시판 카테고리 슬러그 → 한글 라벨 매핑 (community-aside.tsx의 BOARDS와 일치)
// 새 카테고리 추가 시 community-aside.tsx 도 함께 갱신해야 함.
const CATEGORY_LABEL: Record<string, string> = {
  notice: "공지사항",
  general: "자유게시판",
  recruit: "팀원모집",
  review: "대회후기",
  marketplace: "농구장터",
  qna: "질문답변",
  info: "정보공유",
};

export default async function SavedPage() {
  const session = await getWebSession();

  // 비로그인 → 인라인 로그인 유도 카드 (profile/page.tsx 패턴)
  if (!session) {
    return (
      <div className="page">
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 16, display: "block" }}
            >
              bookmark
            </span>
            <p style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-mute)" }}>
              보관함을 보려면 로그인이 필요합니다
            </p>
            <Link href="/login?redirect=/saved" className="btn btn--accent" style={{ display: "inline-block" }}>
              로그인
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userId = BigInt(session.sub);

  // ---- 병렬 prefetch (현재 지원 2종) ----
  // board_favorites: position 오름차순으로 사용자가 정렬한 순서 유지
  // user_favorite_courts: 최근 사용한 코트(last_used_at desc) → null 은 created_at 기준 폴백
  const [boardFavorites, favoriteCourts] = await Promise.all([
    prisma.board_favorites
      .findMany({
        where: { user_id: userId },
        select: {
          id: true,
          category: true,
          position: true,
          created_at: true,
        },
        orderBy: [{ position: "asc" }, { created_at: "asc" }],
      })
      .catch(() => []),

    prisma.user_favorite_courts
      .findMany({
        where: { user_id: userId },
        include: {
          courts: {
            select: {
              id: true,
              public_id: true,
              name: true,
              city: true,
              district: true,
              indoor: true,
              rental_fee: true,
              opening_hours: true,
            },
          },
        },
        orderBy: [{ last_used_at: "desc" }, { created_at: "desc" }],
      })
      .catch(() => []),
  ]);

  // ---- 직렬화 변환 (BigInt → string, Date → ISO) ----
  // 게시판 — 카테고리 매핑 + 미지정 카테고리는 슬러그 그대로 표시
  const boards: SavedBoard[] = boardFavorites.map((b) => ({
    id: b.id.toString(),
    category: b.category,
    label: CATEGORY_LABEL[b.category] ?? b.category,
    savedAt: b.created_at.toISOString(),
  }));

  // 코트 — courts join 데이터 평탄화. courts null 가능(코트 삭제 시) → 필터링.
  const courts: SavedCourt[] = favoriteCourts
    .filter((fc) => fc.courts != null)
    .map((fc) => ({
      id: fc.id.toString(),
      // 상세 링크용 public_id (uuid). 없으면 numeric id fallback.
      courtPublicId: fc.courts!.public_id ?? fc.courts!.id.toString(),
      name: fc.courts!.name,
      area:
        [fc.courts!.city, fc.courts!.district].filter(Boolean).join(" ") || null,
      indoor: fc.courts!.indoor ?? null,
      rentalFee: fc.courts!.rental_fee ?? null,
      openingHours: fc.courts!.opening_hours ?? null,
      nickname: fc.nickname ?? null,
      useCount: fc.use_count,
      // last_used_at 없으면 created_at 폴백 (UI에서 "🔖 저장일" 표기에 사용)
      savedAt: (fc.last_used_at ?? fc.created_at).toISOString(),
    }));

  return <SavedContent boards={boards} courts={courts} />;
}
