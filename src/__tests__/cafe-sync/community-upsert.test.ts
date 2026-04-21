/**
 * community_posts upsert 로직 단위 테스트 (pure 함수 중심, DB 무관).
 *
 * 검증 범위 (2026-04-21 Stage A):
 *   - buildCommunityCafeSourceId — 게시판 간 dataid 충돌 방지
 *   - resolveCommunityAuthorNickname — 익명 게시판 "익명" 강제
 *   - buildCommunityImagesMeta — images JSON 객체 스키마 정확성
 *   - previewCommunityUpsert — 통합 조립
 *
 * DB 쓰기/읽기 없음. Prisma 미사용.
 */

import { describe, it, expect } from "vitest";
import type { CafeBoard } from "@/lib/cafe-sync/board-map";
import {
  buildCommunityCafeSourceId,
  resolveCommunityAuthorNickname,
  buildCommunityImagesMeta,
  previewCommunityUpsert,
  type CafeCommunityInput,
} from "@/lib/cafe-sync/upsert";

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 고정값 — board-map.ts 의 CAFE_BOARDS 와 동일 구조 (의존 안 하도록 복제)
// ─────────────────────────────────────────────────────────────────────────────

const N54V: CafeBoard = {
  id: "N54V",
  target: "community_posts",
  category: "general",
  label: "자유게시판",
};
const IVd2: CafeBoard = {
  id: "IVd2",
  target: "community_posts",
  category: "anonymous",
  anonymousAuthor: true,
  label: "익명게시판",
};
const E7hL: CafeBoard = {
  id: "E7hL",
  target: "community_posts",
  category: "review",
  label: "BDR칼럼",
};
const bWL: CafeBoard = {
  id: "bWL",
  target: "community_posts",
  category: "recruit",
  label: "구인구팀",
};

const baseInput = (board: CafeBoard, dataid: string, author = "홍길동"): CafeCommunityInput => ({
  board,
  dataid,
  title: "테스트 제목",
  author,
  content: "본문 예시 — 010-1234-5678 연락처 포함",
  postedAt: new Date("2026-04-21T10:00:00Z"),
  crawledAt: new Date("2026-04-21T10:05:00Z"),
});

describe("community upsert helpers (2026-04-21)", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. buildCommunityCafeSourceId
  // ───────────────────────────────────────────────────────────────────────────
  describe("buildCommunityCafeSourceId", () => {
    it("board id + dataid 를 조합하여 고유 식별자 생성", () => {
      expect(buildCommunityCafeSourceId("N54V", "123456")).toBe("COM-CAFE-N54V-123456");
      expect(buildCommunityCafeSourceId("E7hL", "999")).toBe("COM-CAFE-E7hL-999");
    });

    it("게시판이 달라도 동일 dataid 라면 서로 다른 source_id 생성 (충돌 방지)", () => {
      const a = buildCommunityCafeSourceId("Dilr", "320221"); // 가정: games 테이블에 이미 존재할 수 있음
      const b = buildCommunityCafeSourceId("bWL", "320221");
      expect(a).not.toBe(b);
      expect(a).toBe("COM-CAFE-Dilr-320221");
      expect(b).toBe("COM-CAFE-bWL-320221");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. resolveCommunityAuthorNickname
  // ───────────────────────────────────────────────────────────────────────────
  describe("resolveCommunityAuthorNickname", () => {
    it("일반 게시판은 원본 닉네임 그대로", () => {
      expect(resolveCommunityAuthorNickname(N54V, "홍길동")).toBe("홍길동");
      expect(resolveCommunityAuthorNickname(E7hL, "관리자")).toBe("관리자");
      expect(resolveCommunityAuthorNickname(bWL, "김구인")).toBe("김구인");
    });

    it("익명게시판(IVd2) 은 원본이 무엇이든 '익명' 강제 (Q3 의도 존중)", () => {
      expect(resolveCommunityAuthorNickname(IVd2, "실제닉네임")).toBe("익명");
      expect(resolveCommunityAuthorNickname(IVd2, "")).toBe("익명");
      expect(resolveCommunityAuthorNickname(IVd2, "admin")).toBe("익명");
    });

    it("일반 게시판인데 author 가 빈 문자열이면 fallback '카페 회원'", () => {
      expect(resolveCommunityAuthorNickname(N54V, "")).toBe("카페 회원");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. buildCommunityImagesMeta
  // ───────────────────────────────────────────────────────────────────────────
  describe("buildCommunityImagesMeta", () => {
    it("일반 게시판 — cafe_author 에 원본 저장, urls 빈 배열", () => {
      const input = baseInput(N54V, "12345", "홍길동");
      const meta = buildCommunityImagesMeta(input);

      expect(meta.cafe_source_id).toBe("COM-CAFE-N54V-12345");
      expect(meta.cafe_board).toBe("N54V");
      expect(meta.cafe_dataid).toBe("12345");
      expect(meta.cafe_author).toBe("홍길동");
      expect(meta.source_url).toBe("https://m.cafe.daum.net/dongarry/N54V/12345");
      expect(meta.cafe_comments).toEqual([]);
      expect(meta.urls).toEqual([]);
    });

    it("익명게시판(IVd2) — cafe_author 에 null 강제 저장 (원본도 보존 X)", () => {
      const input = baseInput(IVd2, "99999", "실제닉네임");
      const meta = buildCommunityImagesMeta(input);

      expect(meta.cafe_author).toBeNull(); // ← Q3 의도: 원본 저장 안 함
      expect(meta.cafe_source_id).toBe("COM-CAFE-IVd2-99999");
    });

    it("dataidNum 있으면 cafe_article_id 포함, 없으면 키 생략", () => {
      const withNum = buildCommunityImagesMeta({ ...baseInput(E7hL, "888"), dataidNum: 888 });
      expect(withNum.cafe_article_id).toBe(888);

      const withoutNum = buildCommunityImagesMeta(baseInput(E7hL, "888"));
      // JSON.stringify 시 undefined 키는 직렬화에서 생략되지만 객체 속성은 존재할 수 있음
      // 테스트는 객체 기준 — undefined 여부 확인
      expect(withoutNum.cafe_article_id).toBeUndefined();
    });

    it("imageUrls 와 comments 가 주입되면 그대로 전달", () => {
      const input: CafeCommunityInput = {
        ...baseInput(bWL, "777"),
        imageUrls: ["https://img.example.com/a.jpg", "https://img.example.com/b.jpg"],
        comments: [{ author: "댓글1", content: "ㅋㅋ" }],
      };
      const meta = buildCommunityImagesMeta(input);

      expect(meta.urls).toEqual([
        "https://img.example.com/a.jpg",
        "https://img.example.com/b.jpg",
      ]);
      expect(meta.cafe_comments).toHaveLength(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. previewCommunityUpsert (통합)
  // ───────────────────────────────────────────────────────────────────────────
  describe("previewCommunityUpsert", () => {
    it("E7hL(BDR칼럼) 입력 → category=review, willInsert=true", () => {
      const input = baseInput(E7hL, "500", "칼럼필진");
      const preview = previewCommunityUpsert(input);

      expect(preview.category).toBe("review");
      expect(preview.authorNickname).toBe("칼럼필진");
      expect(preview.willInsert).toBe(true);
      expect(preview.cafeSourceId).toBe("COM-CAFE-E7hL-500");
      expect(preview.images.cafe_board).toBe("E7hL");
    });

    it("IVd2(익명) 입력 → category=anonymous, authorNickname='익명'", () => {
      const input = baseInput(IVd2, "600", "실제닉");
      const preview = previewCommunityUpsert(input);

      expect(preview.category).toBe("anonymous");
      expect(preview.authorNickname).toBe("익명");
      expect(preview.images.cafe_author).toBeNull();
    });

    it("bWL(구인구팀) 입력 → category=recruit, willInsert=true", () => {
      const input = baseInput(bWL, "700");
      const preview = previewCommunityUpsert(input);

      expect(preview.category).toBe("recruit");
      expect(preview.willInsert).toBe(true);
    });
  });
});
