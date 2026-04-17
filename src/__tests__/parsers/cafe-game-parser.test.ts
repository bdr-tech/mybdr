/**
 * cafe-game-parser 단위 테스트
 *
 * 표본 출처: scripts/inspect-games-sample.ts 출력 (실제 DB id=382~391)
 * 외부 의존성 없음. Prisma/DB 미사용.
 */

import { describe, it, expect } from "vitest";
import {
  parseCafeGame,
  parseFee,
  parseGuestCount,
  parseScheduledAt,
  parseLocation,
} from "@/lib/parsers/cafe-game-parser";

// reference date — 표본이 2026-04-09 작성된 글들이라 모두 2026-04 기준
const REF = new Date("2026-04-09T10:18:00Z");

// ─────────────────────────────────────────────────────────────────────────────
// 단일 헬퍼 단위 테스트
// ─────────────────────────────────────────────────────────────────────────────

describe("parseFee", () => {
  it.each([
    ["5천원", 5000],
    ["7천원 (선입금 요청)", 7000],
    ["1만원", 10000],
    ["1.5만원", 15000],
    ["8,000원", 8000],
    ["8000원", 8000],
    ["6,000원", 6000],
    ["무료", 0],
    [" 무료 ", 0],
    ["10000", 10000],
  ])("%s → %d", (input, expected) => {
    expect(parseFee(input)).toBe(expected);
  });

  it("빈 문자열은 undefined", () => {
    expect(parseFee("")).toBeUndefined();
  });

  it("숫자가 없으면 undefined", () => {
    expect(parseFee("문의주세요")).toBeUndefined();
  });
});

describe("parseGuestCount", () => {
  it.each([
    ["6명", 6],
    ["5명 (8대8 or 6대6대6)", 5],
    ["2 명", 2],
    ["O명(자리표시자)", undefined],
    ["", undefined],
  ])("%s → %s", (input, expected) => {
    expect(parseGuestCount(input)).toBe(expected);
  });
});

describe("parseScheduledAt", () => {
  it("4월 11일 토요일 오후 3시 ~ 5시 → 2026-04-11 15:00 KST", () => {
    const d = parseScheduledAt("4월 11일 토요일  오후 3시 ~ 5시", REF);
    expect(d).toBeDefined();
    // KST 15:00 = UTC 06:00
    expect(d!.toISOString()).toBe("2026-04-11T06:00:00.000Z");
  });

  it("4월 9일 목요일 18:30 - 21:00 → 2026-04-09 18:30 KST", () => {
    const d = parseScheduledAt("4월 9일 목요일 18:30 - 21:00", REF);
    expect(d!.toISOString()).toBe("2026-04-09T09:30:00.000Z");
  });

  it("4월9일 오후8시~10시 → 2026-04-09 20:00 KST", () => {
    const d = parseScheduledAt("4월9일 오후8시~10시", REF);
    expect(d!.toISOString()).toBe("2026-04-09T11:00:00.000Z");
  });

  it("10:00-12:30 (월일 누락) → reference 의 날짜 + 10:00 KST", () => {
    const d = parseScheduledAt("10:00-12:30", REF);
    expect(d!.toISOString()).toBe("2026-04-09T01:00:00.000Z");
  });

  it("4월 9일 오후 7시 ~ 10시 → 2026-04-09 19:00 KST", () => {
    const d = parseScheduledAt("4월 9일 오후 7시 ~ 10시", REF);
    expect(d!.toISOString()).toBe("2026-04-09T10:00:00.000Z");
  });

  it("연도 보정: ref가 2026-11이고 본문이 1월이면 2027년", () => {
    const refNov = new Date("2026-11-15T00:00:00Z");
    const d = parseScheduledAt("1월 5일 오후 7시", refNov);
    expect(d!.getUTCFullYear()).toBe(2027);
  });

  it("빈 문자열 → undefined", () => {
    expect(parseScheduledAt("", REF)).toBeUndefined();
  });

  it("시각 정보가 전혀 없으면 undefined", () => {
    expect(parseScheduledAt("4월 9일", REF)).toBeUndefined();
  });
});

describe("parseLocation", () => {
  it("서울 동작구 사당동 상도중학교 → city=서울, district=동작구", () => {
    const r = parseLocation("동작구 사당동 상도중학교 (서울 동작구 사당로2가길 72)");
    expect(r.city).toBe("서울");
    expect(r.district).toBe("동작구");
  });

  it("관악구민체육센터 → 서울/관악구 자동 보정", () => {
    const r = parseLocation("관악구민체육센터");
    // "관악구민" 은 "관악구" 로 매칭됨
    expect(r.district).toBe("관악구");
    expect(r.city).toBe("서울");
  });

  it("화성시 병점구 효행로 → district=화성시", () => {
    const r = parseLocation("화성시 병점구 효행로 1281-23 반월초등학교");
    expect(r.district).toBe("화성시");
  });

  it("부평구 다목적 실내 체육관 → district=부평구 (광역시 자동매핑X)", () => {
    const r = parseLocation("부평구 다목적 실내 체육관");
    expect(r.district).toBe("부평구");
  });

  it("빈 문자열 → 빈 객체", () => {
    expect(parseLocation("")).toEqual({});
  });

  it("인천광역시 부평구 십정동 → city=인천, district=부평구 (광역시는 district 금지)", () => {
    // 핵심: "인천광역시" 자체를 district 로 잡으면 안 됨
    const r = parseLocation("인천광역시 부평구 십정동 229-2");
    expect(r.city).toBe("인천");
    expect(r.district).toBe("부평구");
  });

  it("서울특별시 강남구 → city=서울, district=강남구", () => {
    const r = parseLocation("서울특별시 강남구 역삼동");
    expect(r.city).toBe("서울");
    expect(r.district).toBe("강남구");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 본문 통합 테스트 — 실제 DB 표본
// ─────────────────────────────────────────────────────────────────────────────

describe("parseCafeGame (실제 표본)", () => {
  it("표본 #389 [동작구] — 모든 필드 정상 추출", () => {
    const content = `1. HOME 팀명 : 리턴즈
2. 일시 : 4월 11일 토요일  오후 3시 ~ 5시
3. 장소 : 동작구 사당동 상도중학교 (서울 동작구 사당로2가길 72)
4. 운영방식 : 교류전
5. 게스트 모집 인원 : 6명
6. 게스트 비용 : 8,000원
7. 연락처 : 010-9구6사-공2공7
8. 게스트 신청 시 필수 정보 : 이름/나이/키/포지션
9. 기타 참고 사항:
흰,검 유니폼 필수 / 주차 가능 / 샤워 불가능`;
    const { data } = parseCafeGame(content, REF);
    expect(data.homeTeamName).toBe("리턴즈");
    expect(data.scheduledAt!.toISOString()).toBe("2026-04-11T06:00:00.000Z");
    expect(data.venueName).toContain("상도중학교");
    expect(data.city).toBe("서울");
    expect(data.district).toBe("동작구");
    expect(data.format).toBe("교류전");
    expect(data.guestCount).toBe(6);
    expect(data.feePerPerson).toBe(8000);
    expect(data.contact).toContain("010");
    expect(data.notes).toContain("유니폼");
  });

  it("표본 #391 — 5천원 비용 + IBex 팀명", () => {
    const content = `1. HOME 팀명 :  IBex
2. 일시 : 4월 2일 20시 ~ 21시30분
3. 장소 : 중구창소년수련관 3층 (약수역 5번출구)
4. 운영방식 : 자체전/4쿼터 2게임/ 팀별7명/5~6쿼터이상보장/ 오는순서대로
5. 게스트 모집 인원 : 6명
6. 게스트 비용 : 5천원 (선입금)
7. 연락처 : 010-8892-0722 문자연락만 부탁드립니다
8. 게스트 신청 시 필수 정보 : 이름/나이/키/포지션 등
9. 기타 참고 사항`;
    const { data } = parseCafeGame(content, REF);
    expect(data.homeTeamName).toBe("IBex");
    expect(data.feePerPerson).toBe(5000);
    expect(data.guestCount).toBe(6);
    expect(data.scheduledAt!.toISOString()).toBe("2026-04-02T11:00:00.000Z"); // 20시 KST
  });

  it("표본 #387 [군포] — 깨진 첫 라인 (1 ... HOME 팀명)", () => {
    const content = `1 ... HOME 팀명 : 라떼는
2. 일시 : 04월09일(목) 오후 8시~10시
3. 장소 : [군포]송죽다목적체육관
4. 운영방식 : 2파전(7 vs 7) or 3파전(6 vs 6 vs 6), 7쿼터보장, 7 or 8분 게임, 순차적 로테이션.
5. 게스트 모집 인원 : 5명
6. 게스트비용 : 7천원
7. 연락처 : 010-7531-1713`;
    const { data } = parseCafeGame(content, REF);
    // "1 ..." 는 LINE_RE 의 라벨 그룹 시작이 \d 가 아니어야 한다는 제약 때문에 못 잡을 가능성 → 검증
    // 일단 라벨이 잡히지 않더라도 나머지는 정상이어야 함
    expect(data.scheduledAt!.toISOString()).toBe("2026-04-09T11:00:00.000Z");
    expect(data.feePerPerson).toBe(7000);
    expect(data.guestCount).toBe(5);
    expect(data.venueName).toContain("송죽");
  });

  it("표본 #390 — HOME 팀명 비어있음", () => {
    const content = `1. HOME 팀명 :
2. 일시 : 10:00-12:30
3. 장소 : (체육관명 명확하게 기재)십정동 229
4. 운영방식 : 자체전 또는 교류전
5. 게스트 모집 인원 : O명(...)
6. 게스트 비용 : 6천원(...)
7. 연락처 :01032639023`;
    const { data } = parseCafeGame(content, REF);
    expect(data.homeTeamName).toBeUndefined(); // 빈 값은 채우지 않음
    expect(data.feePerPerson).toBe(6000);
    expect(data.guestCount).toBeUndefined(); // O명 → undefined
    expect(data.contact).toContain("01032639023");
  });

  it("표본 #388 — 라벨 변형 '게스트비용' / '게스트 신청시 필수 정보'", () => {
    const content = `1. HOME 팀명 : 윙스
2. 일시 : 4월 9일 오후 7시 ~ 10시
3. 장소 : 공항고등학교
4. 게스트 모집 인원 : 4명 (8대8 or 6대6대6)
5. 게스트비용 : 7천원 (선입금 요청)
6. 연락처 : 010-8080-8881
7. 게스트 신청시 필수 정보 : 이름/나이/키/포지션`;
    const { data } = parseCafeGame(content, REF);
    expect(data.homeTeamName).toBe("윙스");
    expect(data.feePerPerson).toBe(7000);
    expect(data.guestCount).toBe(4);
    expect(data.scheduledAt!.toISOString()).toBe("2026-04-09T10:00:00.000Z");
  });

  it("표본 #382 [관악구] — 깨진 첫 라인 (1\\n. HOME) + 6,000원", () => {
    // 실제 DB 본문 그대로 (1과 . 사이 줄바꿈)
    const content = `1
. HOME 팀명 : 관악구 썬즈 (40대 주축 즐농팀)
2. 일시 : 4월 12일 일요일  오전 9시 ~ 11시
3. 장소 : 관악구민체육센터
4. 운영방식 : 자체전 2경기
5. 게스트 모집 인원 : 2명
6. 게스트 비용 : 6,000원
7. 연락처 : 010 - 오사구구 - 오오구영`;
    const { data } = parseCafeGame(content, REF);
    expect(data.homeTeamName).toContain("썬즈");
    expect(data.scheduledAt!.toISOString()).toBe("2026-04-12T00:00:00.000Z"); // 오전 9시 KST = UTC 0시
    expect(data.feePerPerson).toBe(6000);
    expect(data.guestCount).toBe(2);
    expect(data.city).toBe("서울");
    expect(data.district).toBe("관악구");
  });

  it("빈 본문 → 모든 필드 undefined", () => {
    const { data, stats } = parseCafeGame("", REF);
    expect(data.homeTeamName).toBeUndefined();
    expect(stats.matchedLines).toBe(0);
  });

  it("stats.matchedLines 가 라벨 매칭 수와 일치", () => {
    const content = `1. HOME 팀명 : A
2. 일시 : 4월 9일 오후 7시
3. 장소 : 서울 강남구`;
    const { stats } = parseCafeGame(content, REF);
    expect(stats.matchedLines).toBe(3);
    expect(stats.labels).toContain("HOME 팀명");
  });
});
