"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/**
 * /referee/admin/members — 소속 심판 관리 목록 (Client Component).
 *
 * 이유: 필터(검증 상태, 등급) + 페이지네이션이 클라이언트 상태로 관리되어야 하므로 "use client".
 *      assignments 페이지와 동일한 UI 패턴 (데스크톱: 테이블, 모바일: 카드).
 */

// ─── 타입 정의 ───
type MemberItem = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  level: string | null;
  license_number: string | null;
  role_type: string;
  status: string;
  // v3: 매칭 상태
  match_status: "matched" | "unmatched";
  total_certificates: number;
  verified_certificates: number;
  verification_status: "verified" | "partial" | "unverified" | "none";
  joined_at: string;
};

type ApiResponse = {
  items: MemberItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

// ─── 필터 탭 정의 ───
const MATCH_STATUS_TABS = [
  { value: "", label: "전체" },
  { value: "matched", label: "매칭됨" },
  { value: "unmatched", label: "미매칭" },
] as const;

const VERIFICATION_TABS = [
  { value: "", label: "전체" },
  { value: "true", label: "검증됨" },
  { value: "false", label: "미검증" },
] as const;

const LEVEL_OPTIONS = [
  { value: "", label: "전체 등급" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "상급" },
  { value: "international", label: "국제" },
] as const;

// 검증 상태 뱃지
const VERIFY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  verified:   { bg: "var(--color-success, #22c55e)", color: "#fff", label: "검증" },
  partial:    { bg: "var(--color-info, #0079B9)",    color: "#fff", label: "부분" },
  unverified: { bg: "var(--color-primary)",           color: "#fff", label: "미검증" },
  none:       { bg: "var(--color-text-muted)",        color: "#fff", label: "없음" },
};

// v3: 매칭 상태 뱃지
const MATCH_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  matched:   { bg: "var(--color-success, #22c55e)", color: "#fff", label: "매칭됨" },
  unmatched: { bg: "var(--color-warning, #f59e0b)", color: "#000", label: "미매칭" },
};

export default function AdminMembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 필터 & 페이지네이션
  const [matchStatusFilter, setMatchStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 목록 조회
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (matchStatusFilter) params.set("match_status", matchStatusFilter);
      if (verifiedFilter) params.set("verified", verifiedFilter);
      if (levelFilter) params.set("level", levelFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/web/admin/associations/members?${params}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = (await res.json()) as ApiResponse;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
        setErrorMsg(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "심판 목록을 불러올 수 없습니다.");
        setItems([]);
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [matchStatusFilter, verifiedFilter, levelFilter, page]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // 필터 변경 시 1페이지로 리셋
  const handleMatchStatusChange = (value: string) => {
    setMatchStatusFilter(value);
    setPage(1);
  };

  const handleVerifiedChange = (value: string) => {
    setVerifiedFilter(value);
    setPage(1);
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            심판 관리
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            소속 심판 목록을 관리합니다.{" "}
            {total > 0 && (
              <span style={{ color: "var(--color-text-secondary)" }}>
                총 {total.toLocaleString("ko-KR")}명
              </span>
            )}
          </p>
        </div>
        {/* v3: 사전 등록 버튼 */}
        <Link
          href="/referee/admin/members/new"
          className="flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            borderRadius: 4,
          }}
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          사전 등록
        </Link>
      </header>

      {/* 에러 배너 */}
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

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-3">
        {/* v3: 매칭 상태 필터 */}
        <div className="flex gap-2">
          {MATCH_STATUS_TABS.map((tab) => {
            const active = matchStatusFilter === tab.value;
            return (
              <button
                key={`match-${tab.value}`}
                type="button"
                onClick={() => handleMatchStatusChange(tab.value)}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  borderRadius: 4,
                  border: active ? "none" : "1px solid var(--color-border)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 검증 상태 필터 */}
        <div className="flex gap-2">
          {VERIFICATION_TABS.map((tab) => {
            const active = verifiedFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleVerifiedChange(tab.value)}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  borderRadius: 4,
                  border: active ? "none" : "1px solid var(--color-border)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 등급 필터 (select) */}
        <select
          value={levelFilter}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-bold"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 목록 */}
      {loading ? (
        <p
          className="p-8 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </p>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center px-6 py-16 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            group_off
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            심판이 없습니다
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            소속 심판이 등록되면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* 데스크톱: 테이블 */}
          <div
            className="hidden lg:block overflow-x-auto"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">등급</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">매칭</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">자격증</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">검증</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr
                    key={String(m.id)}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div style={{ color: "var(--color-text-primary)" }} className="font-semibold">
                        {m.user_name ?? "이름 없음"}
                      </div>
                      {m.user_email && (
                        <div className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {m.user_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {m.level ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <MatchBadge status={m.match_status} />
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {m.total_certificates}건
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={m.verification_status} />
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                      {m.status}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/referee/admin/members/${m.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold"
                        style={{
                          color: "var(--color-primary)",
                          border: "1px solid var(--color-primary)",
                          borderRadius: 4,
                        }}
                      >
                        상세
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드형 */}
          <ul className="space-y-3 lg:hidden">
            {items.map((m) => (
              <li
                key={String(m.id)}
                className="p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {m.user_name ?? "이름 없음"}
                    </h3>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {m.level ?? "등급 미설정"} | 자격증 {m.total_certificates}건
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <MatchBadge status={m.match_status} />
                    <VerificationBadge status={m.verification_status} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/referee/admin/members/${m.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold"
                    style={{
                      color: "var(--color-primary)",
                      border: "1px solid var(--color-primary)",
                      borderRadius: 4,
                    }}
                  >
                    상세보기
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
                style={{
                  color: page <= 1 ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                이전
              </button>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
                style={{
                  color: page >= totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                다음
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// v3: 매칭 상태 뱃지
function MatchBadge({ status }: { status: string }) {
  const badge = MATCH_BADGE[status] ?? {
    bg: "var(--color-surface)",
    color: "var(--color-text-muted)",
    label: status,
  };
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: badge.bg,
        color: badge.color,
        borderRadius: 4,
      }}
    >
      {badge.label}
    </span>
  );
}

// 검증 상태 뱃지
function VerificationBadge({ status }: { status: string }) {
  const badge = VERIFY_BADGE[status] ?? {
    bg: "var(--color-surface)",
    color: "var(--color-text-muted)",
    label: status,
  };
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: badge.bg,
        color: badge.color,
        borderRadius: 4,
      }}
    >
      {badge.label}
    </span>
  );
}
