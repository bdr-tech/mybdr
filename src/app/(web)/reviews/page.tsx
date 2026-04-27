/* ============================================================
 * /reviews — 커뮤니티 리뷰 (Reviews) v2 신규
 *
 * 왜 서버 컴포넌트로:
 * - PM 결정(C안: Saved 패턴 응용): API/Prisma 0 변경. 기존 `court_reviews` 모델만 사용.
 *   서버에서 published 리뷰만 prefetch → 클라이언트가 4탭/정렬 필터링.
 * - 리뷰는 공개 콘텐츠 → 비로그인도 열람 가능. 세션 분기 없음.
 *
 * 데이터 소스 (4탭 중 1탭만 실데이터):
 *   1) court_reviews          — status='published' 최신순. court_infos + User join.
 *   2) tournament_reviews     — 모델 없음 → 빈 배열 + "준비 중" 카드
 *   3) team_reviews           — 모델 없음 → 빈 배열 + "준비 중" 카드
 *   4) referee_reviews        — 모델 없음 → 빈 배열 + "준비 중" 카드
 *
 * 미지원 항목 (scratchpad "🚧 추후 구현 — Phase 5 Reviews"):
 *   - tournament_reviews / team_reviews / referee_reviews 모델 신규
 *   - helpful_count 컬럼 (현재 likes_count로 대체)
 *   - 리뷰 태그 시스템
 *   - User 레벨 (xp 기반)
 *   - 리뷰 작성 통합 폼
 *   - 신고 기능
 *
 * 보안:
 *   - status='published' 만 노출. draft/hidden/deleted 제외.
 *   - 공개 데이터이므로 IDOR 무관. BigInt → string, Date → ISO 변환만 수행.
 * ============================================================ */

import { prisma } from "@/lib/db/prisma";

import { ReviewsContent, type CourtReviewItem } from "./_v2/reviews-content";

// 본 리스트는 게시 직후 노출이 중요 — 캐시 금지
export const dynamic = "force-dynamic";

// content 첫 줄을 제목으로, 나머지를 본문으로 분리 (시안 title/body 구조 매핑)
// content 가 한 줄짜리면 title=content / body="" 로 가도록 처리.
function splitTitleBody(content: string | null): { title: string; body: string } {
  if (!content) return { title: "리뷰", body: "" };
  const trimmed = content.trim();
  if (!trimmed) return { title: "리뷰", body: "" };
  // 줄바꿈으로 분리 — 첫 줄 = 제목, 나머지 = 본문
  const idx = trimmed.indexOf("\n");
  if (idx < 0) {
    // 한 줄짜리. 너무 길면 50자 컷 후 본문으로 이동
    if (trimmed.length > 60) {
      return { title: trimmed.slice(0, 50) + "…", body: trimmed };
    }
    return { title: trimmed, body: "" };
  }
  const title = trimmed.slice(0, idx).trim() || "리뷰";
  const body = trimmed.slice(idx + 1).trim();
  return { title, body };
}

// photos JSON 컬럼은 string[] 또는 null/빈 배열. 길이만 사용 (시안 "📷 사진 N장").
function countPhotos(photos: unknown): number {
  if (!Array.isArray(photos)) return 0;
  return photos.length;
}

export default async function ReviewsPage() {
  // ---- 코트 리뷰 prefetch (status='published' 최신순) ----
  // 시안 시뮬레이션 데이터 8건 수준이므로 60건 한계로 제한 (필요 시 페이지네이션 추가 작업)
  const courtReviews = await prisma.court_reviews
    .findMany({
      where: { status: "published" },
      include: {
        court_infos: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            address: true,
          },
        },
        users: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 60,
    })
    .catch(() => []);

  // ---- 직렬화 변환 (BigInt → string, Date → ISO) ----
  const courts: CourtReviewItem[] = courtReviews
    // 코트 또는 작성자가 삭제된 리뷰는 제외 (외래키 onDelete: NoAction이라 일반적으로는 남아있음)
    .filter((r) => r.court_infos != null && r.users != null)
    .map((r) => {
      const { title, body } = splitTitleBody(r.content);
      const court = r.court_infos!;
      const user = r.users!;
      // targetSub 우선순위: city district 조합 → address fallback
      const cityDistrict = [court.city, court.district].filter(Boolean).join(" ");
      const targetSub = cityDistrict || court.address || "";
      // 작성자 표시: nickname 우선 → name fallback → "익명"
      // (User.name 은 실명일 수 있으나 닉네임 미설정 회원의 표기가 비어있는 것보다 표시하는 편이 UX 우선)
      const author = user.nickname?.trim() || user.name?.trim() || "익명";

      return {
        id: r.id.toString(),
        // 코트 상세 라우트는 BigInt(id) 기반이므로 numeric id 그대로 사용
        courtId: court.id.toString(),
        target: court.name,
        targetSub,
        rating: r.rating,
        title,
        body,
        // 시안 helpful = 도움됨 카운트. 현재 DB는 likes_count 단일 컬럼이므로 동일 매핑.
        // 추후 helpful_count 컬럼 분리 시 교체.
        likes: r.likes_count,
        helpful: r.likes_count,
        photos: countPhotos(r.photos),
        // 시안 verified = 실제 방문 인증. 현재 is_checkin(체크인 여부)로 매핑.
        verified: r.is_checkin,
        author,
        // 작성자 레벨은 users.xp/role 미사용 → "L.—" placeholder
        authorLevel: "L.—",
        // YYYY.MM.DD 표기는 클라에서 fmtDate 사용 — 여기는 ISO 그대로
        createdAt: r.created_at.toISOString(),
      };
    });

  return <ReviewsContent courts={courts} />;
}
