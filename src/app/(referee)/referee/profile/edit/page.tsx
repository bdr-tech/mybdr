"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * /referee/profile/edit — 프로필 생성/수정 공용 폼 (Client Component)
 *
 * 이유: 단일 폼으로 생성(POST)/수정(PUT)을 모두 처리한다. 마운트 시 GET으로 본인
 *      Referee를 먼저 조회해서 있으면 수정 모드, 없으면 생성 모드로 전환.
 *      Zod 클라 검증은 생략하고 서버 검증을 신뢰 (컨벤션 준수).
 */

type Association = {
  id: string;
  code: string;
  name: string;
  level: string;
  region_sido: string | null;
  parent_id: string | null;
};

type Referee = {
  id: string;
  association_id: string | null;
  license_number: string | null;
  level: string | null;
  role_type: string;
  region_sido: string | null;
  region_sigungu: string | null;
  status: string;
  bio: string | null;
};

type FormState = {
  association_id: string;
  license_number: string;
  level: string;
  role_type: string;
  region_sido: string;
  region_sigungu: string;
  bio: string;
};

const initialForm: FormState = {
  association_id: "",
  license_number: "",
  level: "",
  role_type: "referee",
  region_sido: "",
  region_sigungu: "",
  bio: "",
};

export default function RefereeProfileEditPage() {
  const router = useRouter();

  const [associations, setAssociations] = useState<Association[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  // 생성 모드인지 수정 모드인지 (GET 결과로 결정)
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 초기 로드: 협회 목록 + 본인 Referee 병렬 fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [assocRes, meRes] = await Promise.all([
          fetch("/api/web/associations"),
          fetch("/api/web/referees/me", { credentials: "include" }),
        ]);

        // 협회 목록은 항상 성공해야 정상
        if (assocRes.ok) {
          const data = (await assocRes.json()) as Association[];
          if (!cancelled) setAssociations(data);
        }

        // 본인 Referee: 200이면 수정 모드, 404면 생성 모드
        if (meRes.ok) {
          const data = (await meRes.json()) as {
            has_referee: boolean;
            referee: Referee;
          };
          if (!cancelled && data.has_referee && data.referee) {
            setIsEditMode(true);
            setForm({
              association_id: data.referee.association_id ?? "",
              license_number: data.referee.license_number ?? "",
              level: data.referee.level ?? "",
              role_type: data.referee.role_type ?? "referee",
              region_sido: data.referee.region_sido ?? "",
              region_sigungu: data.referee.region_sigungu ?? "",
              bio: data.referee.bio ?? "",
            });
          }
        }
      } catch {
        if (!cancelled) setErrorMsg("초기 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 공통 onChange 헬퍼
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // 제출: 생성 모드면 POST, 수정 모드면 PUT
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setErrorMsg(null);

      // 빈 문자열은 null로 보내서 DB에 "명시적 지우기"로 처리
      const payload = {
        association_id: form.association_id || null,
        license_number: form.license_number || null,
        level: form.level || null,
        role_type: form.role_type,
        region_sido: form.region_sido || null,
        region_sigungu: form.region_sigungu || null,
        bio: form.bio || null,
      };

      try {
        const res = await fetch("/api/web/referees/me", {
          method: isEditMode ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // 서버 에러 메시지가 있으면 사용
          let message = "저장하지 못했습니다.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data?.error) message = data.error;
          } catch {
            /* JSON 파싱 실패 시 기본 메시지 */
          }
          setErrorMsg(message);
          setSubmitting(false);
          return;
        }

        // 성공 → 조회 페이지로 이동
        router.push("/referee/profile");
        router.refresh();
      } catch {
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setSubmitting(false);
      }
    },
    [form, isEditMode, router],
  );

  if (loading) {
    return (
      <div
        className="p-8 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          {isEditMode ? "프로필 수정" : "프로필 등록"}
        </h1>
        <Link
          href="/referee/profile"
          className="text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          취소
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-5"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        {/* 소속 협회 */}
        <Field label="소속 협회" htmlFor="association_id">
          <select
            id="association_id"
            value={form.association_id}
            onChange={(e) => updateField("association_id", e.target.value)}
            className="w-full px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <option value="">협회를 선택하세요</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        {/* 역할 (라디오) */}
        <Field label="역할">
          <div className="flex gap-2">
            {(["referee", "scorer", "timer"] as const).map((opt) => {
              const active = form.role_type === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => updateField("role_type", opt)}
                  className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: active
                      ? "var(--color-primary)"
                      : "var(--color-surface)",
                    color: active ? "var(--color-text-on-primary, #fff)" : "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 숙련도 */}
        <Field label="숙련도" htmlFor="level">
          <select
            id="level"
            value={form.level}
            onChange={(e) => updateField("level", e.target.value)}
            className="w-full px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <option value="">선택 안 함</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="international">International</option>
          </select>
        </Field>

        {/* 자격번호 (수정 모드에서만 노출) */}
        {isEditMode && (
          <Field label="자격번호" htmlFor="license_number">
            <input
              id="license_number"
              type="text"
              value={form.license_number}
              onChange={(e) => updateField("license_number", e.target.value)}
              placeholder="예: KBA-2023-12345"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </Field>
        )}

        {/* 지역 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="시/도" htmlFor="region_sido">
            <input
              id="region_sido"
              type="text"
              value={form.region_sido}
              onChange={(e) => updateField("region_sido", e.target.value)}
              placeholder="서울"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </Field>
          <Field label="시/군/구" htmlFor="region_sigungu">
            <input
              id="region_sigungu"
              type="text"
              value={form.region_sigungu}
              onChange={(e) => updateField("region_sigungu", e.target.value)}
              placeholder="강남구"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </Field>
        </div>

        {/* 소개 */}
        <Field label="소개" htmlFor="bio">
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="경력, 주요 대회 이력 등을 입력하세요 (최대 500자)"
            className="w-full px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          />
        </Field>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div
            className="px-3 py-2 text-xs"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              borderRadius: 4,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* 제출 */}
        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/referee/profile"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "저장 중..." : isEditMode ? "수정 완료" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 라벨 + 입력 필드 컨테이너 (중복 제거)
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
