"use client";

import { PreferenceForm } from "@/components/shared/preference-form";

/**
 * 프로필 선호 설정 페이지 (설정 메뉴에서 접근)
 *
 * 온보딩 이후에도 언제든 선호 설정을 변경할 수 있는 페이지.
 * 공통 PreferenceForm 컴포넌트를 "settings" 모드로 사용한다.
 * (settings 모드에서는 스킵 버튼이 표시되지 않음)
 */
export default function PreferencesPage() {
  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text-primary)">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <h1 className="text-2xl font-bold mb-2">맞춤 설정</h1>
        <p className="text-(--color-text-secondary) mb-8">
          관심 종별, 경기 유형, 게시판을 설정하면 맞춤 콘텐츠를 받아볼 수 있습니다
        </p>

        {/* 공통 폼 컴포넌트 - settings 모드 (스킵 버튼 없음) */}
        <PreferenceForm mode="settings" />
      </div>
    </div>
  );
}
