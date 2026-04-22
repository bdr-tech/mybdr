"use client";

// Phase 2B: 영문 팀명 + 대표 언어 선택 UI 추가
// - Server Action(createTeamAction)은 이미 name_en / name_primary를 FormData로 받는다 (actions/teams.ts)
// - 여기서는 useState로 제어해서 실시간 버튼 토글 + 영문명 한글 혼입 차단만 담당한다
// - 영문명 입력이 비어 있으면 대표 팀명 선택 UI는 숨기고 기본값 "ko"로 제출된다

import { useActionState, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTeamAction } from "@/app/actions/teams";

// 영문명 허용 패턴 — 영문/숫자/공백/하이픈만 (서버 Zod 스키마와 동일 규칙)
const NAME_EN_PATTERN = /^[A-Za-z0-9 \-]+$/;

export function NewTeamForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, null);

  // 한글 팀명 — 미리보기 버튼에 실시간 반영하려고 상태로 뺌
  const [name, setName] = useState("");
  // 영문 팀명 (선택). 비우면 null로 저장된다.
  const [nameEn, setNameEn] = useState("");
  // 대표 팀명 — 기본값 "ko"
  const [namePrimary, setNamePrimary] = useState<"ko" | "en">("ko");
  // 클라이언트 검증 에러 (한글 혼입 시)
  const [nameEnError, setNameEnError] = useState<string | null>(null);

  // 제출 전 영문명 형식 체크 — 서버 400을 막고 친절한 메시지 노출
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const trimmed = nameEn.trim();
    if (trimmed && !NAME_EN_PATTERN.test(trimmed)) {
      e.preventDefault();
      setNameEnError("영문/숫자/공백/하이픈만 입력할 수 있습니다.");
      return;
    }
    setNameEnError(null);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>팀 만들기</h1>

      <Card>
        {/* 팀 생성 서버 액션 에러 — 하드코딩 red-500/600 → error 토큰 (bg color-mix 10%, text error) */}
        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-4 py-3 text-sm text-[var(--color-error)]">
            {state.error}
          </div>
        )}
        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          {/* 한글 팀명 (필수) */}
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">팀 이름 *</label>
            <input
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="팀 이름"
            />
          </div>

          {/* Phase 2B: 영문 팀명 (선택) */}
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              영문 팀명{" "}
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                (선택)
              </span>
            </label>
            <input
              name="name_en"
              type="text"
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value);
                if (nameEnError) setNameEnError(null); // 수정 시 에러 해제
              }}
              placeholder="RISING EAGLES"
              // pattern은 HTML5 단계 힌트 — 실제 차단은 JS에서 수행
              pattern="[A-Za-z0-9 \-]+"
              className="w-full rounded-[16px] border px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              style={{
                borderColor: nameEnError ? "rgb(239 68 68)" : "var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-text-primary)",
              }}
            />
            {nameEnError ? (
              // 영문명 유효성 에러 텍스트 — red-500 → error 토큰
              <p className="mt-1 text-xs text-[var(--color-error)]">{nameEnError}</p>
            ) : (
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                대한민국농구협회 등록 영문명. 영문/숫자/공백/하이픈만 허용.
              </p>
            )}
          </div>

          {/* Phase 2B: 대표 팀명 선택 — 영문명이 입력됐을 때만 노출 */}
          {nameEn.trim() && (
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                대표 팀명{" "}
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  (우선 표시)
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNamePrimary("ko")}
                  className="flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    namePrimary === "ko"
                      ? {
                          borderColor: "var(--color-primary)",
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                        }
                      : {
                          borderColor: "var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                        }
                  }
                >
                  한글 ({name || "팀명"})
                </button>
                <button
                  type="button"
                  onClick={() => setNamePrimary("en")}
                  className="flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    namePrimary === "en"
                      ? {
                          borderColor: "var(--color-primary)",
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                        }
                      : {
                          borderColor: "var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                        }
                  }
                >
                  영문 ({nameEn})
                </button>
              </div>
            </div>
          )}
          {/* 대표 팀명은 숨은 필드로 항상 제출 (영문명 없으면 기본 "ko") */}
          <input type="hidden" name="name_primary" value={namePrimary} />

          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">팀 소개</label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="팀 소개"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대표 색상 <span className="text-xs text-[var(--color-text-secondary)]">(유니폼 메인 컬러)</span></label>
              <input
                name="primary_color"
                type="color"
                defaultValue="#E31B23"
                className="h-12 w-full cursor-pointer rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-1"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">보조 색상 <span className="text-xs text-[var(--color-text-secondary)]">(유니폼 서브 컬러)</span></label>
              <input
                name="secondary_color"
                type="color"
                defaultValue="#E76F51"
                className="h-12 w-full cursor-pointer rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "생성 중..." : "팀 만들기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
