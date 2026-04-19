"use client";

/**
 * 프로필 완성 유도 배너 (5단계 프로그레스)
 *
 * 이유:
 *  - 기존 배너는 "이름 있으면 끝"이라는 단순 판정이었으나, UX 감사 결과
 *    회원가입 → 연락처인증 → 기본정보 → 농구정보 → 맞춤설정까지 5단계 전부
 *    채워야 진짜 완성이다. 단계별 진행도를 보여주고 "다음 단계로 유도"해야
 *    중도 이탈이 줄어든다.
 *
 * 방법:
 *  1. useSWR로 /api/web/me 호출 (dedupingInterval 30s — 같은 세션 중복 방지)
 *  2. getCompletionStep()으로 현재 단계(1~5) 판정
 *  3. 도트 5개 + "n / 5" 표시 + 다음 단계 CTA 링크
 *  4. 5단계 완료 or profile_completed=true → null 반환 (배너 숨김)
 *  5. X 버튼 → localStorage 7일 억제
 *
 * 주의:
 *  - layout.tsx에서 이미 userName prop을 넘겨주고 있으므로 시그니처 유지
 *    (prop은 받기만 하고 내부에서 무시 — layout 건드리지 않기 위함)
 *  - 하드코딩 색상 금지. var(--color-primary) / var(--color-on-primary) 사용
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";

// 배너 닫기 키와 억제 기간 (7일)
const DISMISS_KEY = "profile_banner_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

// /api/web/me 응답에서 배너 판정에 쓰는 필드만 추린 타입
// (apiSuccess는 snake_case로 직렬화하므로 snake_case 그대로 읽음)
interface MeResponse {
  id?: string;
  name?: string | null;
  phone?: string | null;
  position?: string | null;
  height?: number | null;
  profile_completed?: boolean;
  preferred_divisions?: unknown;
  preferred_regions?: unknown;
  preferred_days?: unknown;
  preferred_time_slots?: unknown;
  preferred_skill_levels?: unknown;
  preferred_game_types?: unknown;
}

// 단계 판정 결과 타입 — step(1~5)과 다음 단계의 CTA 정보
interface StepInfo {
  step: number; // 현재까지 채운 단계 수 (0~5)
  nextLabel: string; // "다음 단계"의 한글 라벨
  nextHref: string; // 다음 단계 페이지 경로
  isComplete: boolean; // 5단계 모두 끝났는지
}

// 배열/JSON 필드가 "실제로 값이 있는지" 판정
// 이유: Prisma Json 필드는 []가 기본값이므로 length 기반으로 판단해야 함
function hasPreference(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  // 혹시 object 형태로 오면 key 수로 판단 (안전장치)
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

/**
 * 5단계 판정 함수
 *  1단계: 회원가입 완료 (me 응답이 오면 무조건 통과 — 세션 존재)
 *  2단계: 연락처(phone) 인증 완료
 *  3단계: 기본정보(name) 입력
 *  4단계: 농구정보(position OR height) 입력
 *  5단계: 맞춤설정(preferred_* 중 하나라도 선택)
 */
function getCompletionStep(me: MeResponse | undefined): StepInfo {
  // me 없으면(로그아웃 상태) 0단계로 반환 — 호출측에서 배너 숨김
  if (!me || !me.id) {
    return { step: 0, nextLabel: "", nextHref: "", isComplete: false };
  }

  // profile_completed 플래그가 true면 모든 단계 완료로 간주 (DB 진실의 원천)
  if (me.profile_completed) {
    return { step: 5, nextLabel: "", nextHref: "", isComplete: true };
  }

  // 1단계: 세션 존재 = 회원가입 완료
  let step = 1;

  // 2단계: 연락처(phone)가 채워져 있어야 통과
  const hasPhone = !!(me.phone && me.phone.trim().length > 0);
  if (!hasPhone) {
    return {
      step,
      nextLabel: "연락처 인증",
      nextHref: "/verify",
      isComplete: false,
    };
  }
  step = 2;

  // 3단계: 기본정보 = 이름(name) 입력 여부
  const hasName = !!(me.name && me.name.trim().length > 0);
  if (!hasName) {
    return {
      step,
      nextLabel: "기본 정보 입력",
      nextHref: "/profile/complete",
      isComplete: false,
    };
  }
  step = 3;

  // 4단계: 농구정보 = 포지션 OR 키 중 하나라도 있으면 통과
  const hasBasketball =
    !!(me.position && me.position.trim().length > 0) ||
    !!(me.height && me.height > 0);
  if (!hasBasketball) {
    return {
      step,
      nextLabel: "농구 정보 입력",
      nextHref: "/profile/basketball",
      isComplete: false,
    };
  }
  step = 4;

  // 5단계: 맞춤설정 = preferred_* 6개 중 하나라도 값이 있으면 통과
  const hasPreferences =
    hasPreference(me.preferred_divisions) ||
    hasPreference(me.preferred_regions) ||
    hasPreference(me.preferred_days) ||
    hasPreference(me.preferred_time_slots) ||
    hasPreference(me.preferred_skill_levels) ||
    hasPreference(me.preferred_game_types);
  if (!hasPreferences) {
    return {
      step,
      nextLabel: "맞춤 설정",
      nextHref: "/profile/complete/preferences",
      isComplete: false,
    };
  }

  // 모든 단계 통과
  return { step: 5, nextLabel: "", nextHref: "", isComplete: true };
}

interface ProfileCompletionBannerProps {
  /**
   * layout.tsx 호환용 prop — 내부에서는 사용하지 않음.
   * 이유: useSWR로 /api/web/me를 직접 호출해 5단계 판정에 필요한 모든 필드를
   *       한 번에 받아온다. 레이아웃 파일을 건드리지 않기 위해 시그니처만 유지.
   */
  userName?: string | null | undefined;
}

export function ProfileCompletionBanner(_props: ProfileCompletionBannerProps) {
  // SWR로 me 조회 — 30초 내 중복 호출 방지 (다른 컴포넌트와 캐시 공유)
  const { data: me } = useSWR<MeResponse>("/api/web/me", {
    dedupingInterval: 30000,
  });

  const [dismissed, setDismissed] = useState(false);

  // 마운트 시 localStorage의 닫기 타임스탬프 확인 (7일 이내면 숨김)
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION) setDismissed(true);
    }
  }, []);

  // 로딩 중 or 닫힘 상태면 일찍 리턴
  if (!me || dismissed) return null;

  // 단계 판정 — 완료면 배너 숨김
  const info = getCompletionStep(me);
  if (info.isComplete || info.step === 0) return null;

  /** 닫기 버튼: 현재 시각 저장 → 7일간 재노출 억제 */
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div
      className="mb-4 flex items-center justify-between rounded-md px-4 py-3 shadow-glow-primary"
      style={{
        backgroundColor: "var(--color-primary)",
        // on-primary 변수가 있으면 사용, 없는 런타임 대비 색상은 CSS에 정의됨
        color: "var(--color-on-primary)",
      }}
    >
      {/* 좌측: 진행 도트 + 카운터 + 다음 단계 CTA */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-xl">person</span>

        {/* 도트 5개 — 채운 단계는 불투명, 남은 단계는 반투명 */}
        <div className="flex items-center gap-1" aria-label={`프로필 진행 ${info.step} / 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full"
              style={{
                // 완료된 단계는 on-primary 색 풀로, 미완료는 30% 투명도
                backgroundColor: "var(--color-on-primary)",
                opacity: i <= info.step ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        {/* 진행도 카운터 — "n / 5" */}
        <span className="text-[12px] font-black uppercase tracking-wide">
          {info.step} / 5
        </span>

        {/* 다음 단계로 이동 링크 */}
        <Link
          href={info.nextHref}
          className="ml-1 rounded-sm bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ color: "var(--color-primary)" }}
        >
          {info.nextLabel} 시작 →
        </Link>
      </div>

      {/* 우측: 닫기 버튼 (7일 숨김) */}
      <button
        onClick={handleDismiss}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-white/20"
        style={{ color: "var(--color-on-primary)" }}
        aria-label="배너 닫기"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
