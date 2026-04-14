"use client";

import { useEffect, useState } from "react";

/**
 * /referee/admin/fee-settings — 협회 배정비 단가표 설정 (사무국장 전용)
 *
 * 이유: 매번 배정 생성 시 금액을 입력하지 않아도 되도록, 협회별로 역할(주심/부심/기록/타이머)
 *      기본 배정비를 설정. PUT 권한은 settlement_manage(사무국장)만.
 *
 * 동작:
 *   - GET으로 현재 단가표 로드 (없으면 기본값 표시 + is_default=true)
 *   - 입력 값 검증 후 PUT으로 저장
 *   - 천단위 콤마 표시(입력은 raw number, 표시만 콤마)
 */

type Setting = {
  id: string | null;
  association_id: string;
  fee_main: number;
  fee_sub: number;
  fee_recorder: number;
  fee_timer: number;
  updated_at: string | null;
  is_default: boolean;
};

const ROLE_INFO = [
  { key: "fee_main", label: "주심", icon: "sports" },
  { key: "fee_sub", label: "부심", icon: "groups" },
  { key: "fee_recorder", label: "기록원", icon: "edit_note" },
  { key: "fee_timer", label: "타이머", icon: "timer" },
] as const;

const formatMoney = (n: number) => n.toLocaleString("ko-KR");

export default function AdminFeeSettingsPage() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 입력 값 (string으로 보관 — 콤마 표시/포커스 시 raw 처리 단순화)
  const [main, setMain] = useState("");
  const [sub, setSub] = useState("");
  const [recorder, setRecorder] = useState("");
  const [timer, setTimer] = useState("");

  // 초기 로드
  useEffect(() => {
    fetch("/api/web/referee-admin/fee-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.setting) {
          const s = d.setting as Setting;
          setSetting(s);
          setMain(String(s.fee_main));
          setSub(String(s.fee_sub));
          setRecorder(String(s.fee_recorder));
          setTimer(String(s.fee_timer));
        } else {
          setError(d?.error ?? "단가표를 불러오지 못했습니다.");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "조회 실패"))
      .finally(() => setLoading(false));
  }, []);

  // 저장 핸들러
  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // 입력 값 정수 변환 + 검증
      const toInt = (s: string, label: string) => {
        const n = Number.parseInt(s.replace(/[^0-9]/g, ""), 10);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error(`${label} 금액이 올바르지 않습니다.`);
        }
        return n;
      };
      const body = {
        fee_main: toInt(main, "주심"),
        fee_sub: toInt(sub, "부심"),
        fee_recorder: toInt(recorder, "기록원"),
        fee_timer: toInt(timer, "타이머"),
      };

      const res = await fetch("/api/web/referee-admin/fee-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장 실패");
      setSetting(data.setting);
      setSuccess("단가표가 저장되었습니다.");
      // 3초 후 자동 사라짐
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="space-y-6"
      style={{ color: "var(--color-text-primary)" }}
    >
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-black">배정비 단가</h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          역할별 기본 배정비를 설정합니다. 새 배정 시 자동으로 적용되며, 배정 시 개별 금액 입력도 가능합니다.
        </p>
      </div>

      {/* 안내 박스 */}
      <div
        className="border p-4 text-sm space-y-1"
        style={{
          borderColor: "var(--color-info, #0079B9)",
          backgroundColor:
            "color-mix(in srgb, var(--color-info, #0079B9) 8%, transparent)",
          borderRadius: 4,
        }}
      >
        <div className="font-bold">사용 방법</div>
        <ul
          className="list-disc list-inside space-y-0.5"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <li>
            배정 생성 시 <b>금액 입력 칸을 비우면</b> 이 단가표의 값이
            자동 적용됩니다.
          </li>
          <li>
            배정이 <b>완료(completed)</b> 상태로 변경되는 순간 정산이
            자동으로 생성됩니다.
          </li>
          <li>이미 생성된 정산의 금액은 단가표 변경의 영향을 받지 않습니다.</li>
        </ul>
      </div>

      {/* 로딩 */}
      {loading && (
        <div
          className="p-6 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div
          className="border p-3 text-sm"
          style={{
            borderColor: "var(--color-primary, #E31B23)",
            color: "var(--color-primary, #E31B23)",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {/* 성공 */}
      {success && (
        <div
          className="border p-3 text-sm"
          style={{
            borderColor: "var(--color-success, #22c55e)",
            color: "var(--color-success, #22c55e)",
            borderRadius: 4,
          }}
        >
          {success}
        </div>
      )}

      {/* 폼 */}
      {!loading && setting && (
        <>
          {setting.is_default && (
            <div
              className="border p-3 text-sm"
              style={{
                borderColor: "var(--color-warning, #f59e0b)",
                color: "var(--color-warning, #f59e0b)",
                borderRadius: 4,
              }}
            >
              아직 단가표가 저장되지 않았습니다. 아래 기본값을 확인 후
              저장해주세요.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ROLE_INFO.map((r) => {
              // 4개 입력 폼을 매핑 — 각 키별로 state를 직접 참조
              const value =
                r.key === "fee_main"
                  ? main
                  : r.key === "fee_sub"
                    ? sub
                    : r.key === "fee_recorder"
                      ? recorder
                      : timer;
              const setValue =
                r.key === "fee_main"
                  ? setMain
                  : r.key === "fee_sub"
                    ? setSub
                    : r.key === "fee_recorder"
                      ? setRecorder
                      : setTimer;
              const numeric = Number.parseInt(value || "0", 10) || 0;

              return (
                <label
                  key={r.key}
                  className="border p-4 block"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    borderRadius: 4,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {r.icon}
                    </span>
                    <span className="text-sm font-bold">{r.label}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={value}
                      onChange={(e) =>
                        // 숫자만 추출 — 콤마 입력 허용 후 정리
                        setValue(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-base font-bold pr-10"
                      style={{
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-text-primary)",
                        borderRadius: 4,
                      }}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      원
                    </span>
                  </div>
                  <div
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatMoney(numeric)}원
                  </div>
                </label>
              );
            })}
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center justify-between">
            <div
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {setting.updated_at
                ? `최근 저장: ${new Date(setting.updated_at).toLocaleString("ko-KR")}`
                : "아직 저장 이력 없음"}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="px-5 py-2 text-sm font-bold disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-primary, #E31B23)",
                color: "var(--color-text-on-primary, #fff)",
                borderRadius: 4,
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
