/**
 * 개인정보 마스킹 유틸 테스트 (9가드 #5).
 *
 * 검증 목표:
 *   - 전화번호 다양한 구분자 (하이픈/점/공백/없음) 모두 커버
 *   - 계좌번호 10~14자리 마스킹, 5자리 이하 원본 유지
 *   - 혼합 문자열에서 전화+계좌 둘 다 처리
 *   - 빈 문자열/짧은 문자열 안전
 */

import { describe, it, expect } from "vitest";
import {
  maskPhoneNumbers,
  maskAccountNumbers,
  maskPersonalInfo,
} from "@/lib/security/mask-personal-info";

describe("maskPhoneNumbers", () => {
  it("하이픈 구분 표준 형식", () => {
    expect(maskPhoneNumbers("010-1234-5678")).toBe("010-****-****");
  });

  it("점(.) 구분자", () => {
    expect(maskPhoneNumbers("010.1234.5678")).toBe("010-****-****");
  });

  it("공백 구분자", () => {
    expect(maskPhoneNumbers("010 1234 5678")).toBe("010-****-****");
  });

  it("구분자 없음 (11자리 연속)", () => {
    expect(maskPhoneNumbers("01012345678")).toBe("010-****-****");
  });

  it("본문 중간에 섞인 전화번호", () => {
    expect(maskPhoneNumbers("연락처 010-1111-2222 문의")).toBe(
      "연락처 010-****-**** 문의",
    );
  });

  it("여러 개 동시 치환", () => {
    expect(
      maskPhoneNumbers("팀장 010-1111-2222 / 부팀장 010-3333-4444"),
    ).toBe("팀장 010-****-**** / 부팀장 010-****-****");
  });

  it("011/016/017/018/019 prefix도 커버", () => {
    expect(maskPhoneNumbers("011-234-5678")).toBe("011-****-****");
    expect(maskPhoneNumbers("019-9999-8888")).toBe("019-****-****");
  });

  it("빈 문자열 안전", () => {
    expect(maskPhoneNumbers("")).toBe("");
  });
});

describe("maskAccountNumbers", () => {
  it("12자리 계좌 마스킹", () => {
    expect(maskAccountNumbers("110-123-456789")).toBe("110-****-****");
  });

  it("10자리 연속 숫자 마스킹", () => {
    expect(maskAccountNumbers("1234567890")).toBe("123-****-****");
  });

  it("5자리 이하 숫자는 마스킹하지 않음 (대회 ID 등)", () => {
    expect(maskAccountNumbers("대회 ID 12345")).toBe("대회 ID 12345");
  });

  it("9자리 이하는 원본 유지", () => {
    expect(maskAccountNumbers("우편번호 123-456")).toBe("우편번호 123-456");
  });

  it("14자리 초과 숫자는 원본 유지", () => {
    // 15자리 이상은 카드번호/주민번호 영역 → 별도 처리, 여기서는 유지
    expect(maskAccountNumbers("123456789012345")).toBe("123456789012345");
  });

  it("빈 문자열 안전", () => {
    expect(maskAccountNumbers("")).toBe("");
  });
});

describe("maskPersonalInfo (통합)", () => {
  it("전화 + 계좌 모두 마스킹", () => {
    const input = "카페 전화 010-1111-2222 계좌 110-456-7890123";
    const out = maskPersonalInfo(input);
    // 전화는 010-****-****
    expect(out).toContain("010-****-****");
    // 계좌는 110-****-****
    expect(out).toContain("110-****-****");
    // 원본 번호는 완전 제거
    expect(out).not.toContain("1111-2222");
    expect(out).not.toContain("456-7890123");
  });

  it("전화와 계좌가 인접해도 정상 처리", () => {
    const input = "문의 010-1234-5678 / 입금 3333-01-1234567";
    const out = maskPersonalInfo(input);
    expect(out).toContain("010-****-****");
    expect(out).toContain("333-****-****");
  });

  it("대회 ID/일반 짧은 숫자는 보존", () => {
    const input = "대회 ID 12345 / 신청자 수 7 / 전화 010-1234-5678";
    const out = maskPersonalInfo(input);
    expect(out).toContain("12345"); // 5자리 ID 보존
    expect(out).toContain("010-****-****");
  });

  it("빈 문자열 안전", () => {
    expect(maskPersonalInfo("")).toBe("");
  });

  it("본문 전체 시뮬레이션 (전화 + 계좌 + 일반 텍스트 섞임)", () => {
    const input = [
      "1. HOME 팀명 : 불꽃슈터",
      "2. 일시 : 4월 20일 19:00",
      "7. 연락처 : 010-1234-5678",
      "입금은 110-456-789012 카카오뱅크로 부탁드립니다.",
      "대회 번호 999",
    ].join("\n");
    const out = maskPersonalInfo(input);
    expect(out).toContain("010-****-****");
    expect(out).toContain("110-****-****");
    expect(out).toContain("불꽃슈터"); // 일반 텍스트 영향 없음
    expect(out).toContain("대회 번호 999"); // 3자리는 마스킹 대상 아님
  });
});
