"use client";

import { useRouter } from "next/navigation";
import { PreferenceForm } from "@/components/shared/preference-form";

/**
 * 온보딩 선호 설정 페이지
 *
 * 프로필 완성(/profile/complete) 후 이동되는 2번째 단계.
 * 관심 종별, 경기 유형, 게시판을 설정하면 맞춤 콘텐츠를 제공한다.
 * "나중에 할게요" 버튼으로 스킵 가능.
 */
export default function OnboardingPreferencesPage() {
  const router = useRouter();

  // 저장 완료 또는 스킵 시 홈으로 이동
  const goHome = () => router.push("/");

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text-primary)">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 페이지 헤더 - 온보딩 맥락에 맞는 안내 */}
        <h1 className="text-2xl font-bold mb-2">맞춤 설정</h1>
        <p className="text-(--color-text-secondary) mb-8">
          관심 종별, 경기 유형, 게시판을 설정하면 맞춤 콘텐츠를 받아볼 수 있습니다
        </p>

        {/* 공통 폼 컴포넌트 - onboarding 모드로 사용 */}
        <PreferenceForm
          mode="onboarding"
          onComplete={goHome}
          onSkip={goHome}
        />
      </div>
    </div>
  );
}
