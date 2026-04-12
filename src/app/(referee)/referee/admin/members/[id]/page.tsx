"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/**
 * /referee/admin/members/[id] — 심판 상세 (Client Component).
 *
 * 이유: 자격증 검증 토글 인터랙션이 필요하므로 "use client".
 *      심판 프로필 + 자격증 목록(각각 검증 토글 버튼) + 배정/정산 최근 기록 표시.
 */

// ─── 타입 정의 ───
type Certificate = {
  id: string;
  cert_type: string;
  cert_grade: string;
  issuer: string;
  cert_number: string | null;
  issued_at: string;
  expires_at: string | null;
  verified: boolean;
  verified_at: string | null;
};

type Assignment = {
  id: string;
  role: string;
  status: string;
  assigned_at: string;
  memo: string | null;
};

type Settlement = {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  memo: string | null;
  created_at: string;
};

type RefereeDetail = {
  id: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  user_birth_date: string | null;
  level: string | null;
  license_number: string | null;
  role_type: string;
  status: string;
  region_sido: string | null;
  region_sigungu: string | null;
  bio: string | null;
  verified_name: string | null;
  verified_birth_date: string | null;
  verified_phone: string | null;
  joined_at: string;
};

type ApiResponse = {
  referee: RefereeDetail;
  certificates: Certificate[];
  assignments: Assignment[];
  settlements: Settlement[];
};

// 역할 한글 매핑
const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};

// 상태 한글 매핑
const STATUS_LABEL: Record<string, string> = {
  assigned: "배정됨",
  confirmed: "확정",
  declined: "거부",
  cancelled: "취소",
  completed: "완료",
  pending: "대기",
  paid: "지급완료",
};

export default function AdminMemberDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 검증 토글 진행 중인 cert id
  const [togglingCertId, setTogglingCertId] = useState<string | null>(null);

  // 데이터 조회
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/admin/associations/members/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse;
        setData(json);
        setErrorMsg(null);
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg((json as { error?: string }).error ?? "심판 정보를 불러올 수 없습니다.");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 자격증 검증 토글
  const handleToggleVerify = async (certId: string, currentVerified: boolean) => {
    setTogglingCertId(certId);
    try {
      const res = await fetch(`/api/web/admin/referee-certificates/${certId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !currentVerified }),
      });

      if (res.ok) {
        // 성공 시 로컬 상태 업데이트
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            certificates: prev.certificates.map((c) =>
              c.id === certId
                ? {
                    ...c,
                    verified: !currentVerified,
                    verified_at: !currentVerified ? new Date().toISOString() : null,
                  }
                : c
            ),
          };
        });
      } else {
        const json = await res.json().catch(() => ({}));
        alert((json as { error?: string }).error ?? "검증 상태 변경에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setTogglingCertId(null);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <p
        className="p-8 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        불러오는 중...
      </p>
    );
  }

  // 에러
  if (errorMsg || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/referee/admin/members"
          className="inline-flex items-center gap-1 text-sm font-bold"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          목록으로
        </Link>
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-primary)",
            border: "1px solid var(--color-primary)",
            borderRadius: 4,
          }}
        >
          {errorMsg ?? "데이터를 불러올 수 없습니다."}
        </div>
      </div>
    );
  }

  const { referee, certificates, assignments, settlements } = data;

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/referee/admin/members"
        className="inline-flex items-center gap-1 text-sm font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        목록으로
      </Link>

      {/* 심판 프로필 */}
      <section
        className="p-5"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <h2
          className="text-lg font-black"
          style={{ color: "var(--color-text-primary)" }}
        >
          {referee.user_name ?? "이름 없음"}
        </h2>
        <div
          className="mt-3 grid gap-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <InfoRow label="이메일" value={referee.user_email} />
          <InfoRow label="전화번호" value={referee.user_phone} />
          <InfoRow label="생년월일" value={referee.user_birth_date ? formatDate(referee.user_birth_date) : null} />
          <InfoRow label="등급" value={referee.level} />
          <InfoRow label="자격번호" value={referee.license_number} />
          <InfoRow label="역할" value={referee.role_type} />
          <InfoRow label="상태" value={referee.status} />
          <InfoRow
            label="지역"
            value={
              referee.region_sido
                ? `${referee.region_sido} ${referee.region_sigungu ?? ""}`
                : null
            }
          />
          <InfoRow label="가입일" value={formatDate(referee.joined_at)} />
        </div>
      </section>

      {/* 자격증 목록 */}
      <section>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          자격증 ({certificates.length}건)
        </h3>
        {certificates.length === 0 ? (
          <p
            className="p-4 text-center text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              color: "var(--color-text-muted)",
            }}
          >
            등록된 자격증이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {certificates.map((c) => (
              <li
                key={String(c.id)}
                className="flex items-center justify-between gap-3 p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {c.cert_type} {c.cert_grade}
                    </span>
                    {c.verified && (
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: "var(--color-success, #22c55e)", fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.issuer} | {formatDate(c.issued_at)}
                    {c.cert_number && ` | ${c.cert_number}`}
                  </p>
                </div>
                {/* 검증 토글 버튼 */}
                <button
                  type="button"
                  disabled={togglingCertId === String(c.id)}
                  onClick={() => handleToggleVerify(String(c.id), c.verified)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: c.verified ? "var(--color-surface)" : "var(--color-primary)",
                    color: c.verified ? "var(--color-text-secondary)" : "#fff",
                    border: c.verified ? "1px solid var(--color-border)" : "none",
                    borderRadius: 4,
                    opacity: togglingCertId === String(c.id) ? 0.5 : 1,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    {c.verified ? "cancel" : "check_circle"}
                  </span>
                  {c.verified ? "검증 취소" : "검증"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 최근 배정 */}
      <section>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          최근 배정 ({assignments.length}건)
        </h3>
        {assignments.length === 0 ? (
          <p
            className="p-4 text-center text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              color: "var(--color-text-muted)",
            }}
          >
            배정 기록이 없습니다.
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                  <th className="px-4 py-2 text-left text-xs font-bold">역할</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">상태</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">배정일</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">메모</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={String(a.id)} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-primary)" }}>
                      {ROLE_LABEL[a.role] ?? a.role}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(a.assigned_at)}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {a.memo ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 최근 정산 */}
      <section>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          최근 정산 ({settlements.length}건)
        </h3>
        {settlements.length === 0 ? (
          <p
            className="p-4 text-center text-sm"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              color: "var(--color-text-muted)",
            }}
          >
            정산 기록이 없습니다.
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                  <th className="px-4 py-2 text-left text-xs font-bold">금액</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">상태</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">지급일</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">메모</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={String(s.id)} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="px-4 py-2 font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {s.amount.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {s.paid_at ? formatDate(s.paid_at) : "-"}
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {s.memo ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── 하위 컴포넌트 ───

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <span
        className="w-20 shrink-0 text-xs font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <span style={{ color: "var(--color-text-primary)" }}>
        {value ?? "-"}
      </span>
    </div>
  );
}

// ─── 유틸 함수 ───

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}
