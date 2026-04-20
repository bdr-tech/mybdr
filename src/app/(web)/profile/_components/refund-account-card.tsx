"use client";

/* ============================================================
 * RefundAccountCard — /profile 허브 대시보드 "환불 계좌" 카드
 *
 * 왜:
 *  - 사용자는 자신이 등록한 환불 계좌 정보를 재빨리 확인하고
 *    틀렸다면 바로 수정으로 넘어갈 수 있어야 한다.
 *  - 원본 계좌번호는 API에서 이미 마스킹되어 내려오므로
 *    이 컴포넌트는 표시만 담당.
 * ============================================================ */

import Link from "next/link";

export interface RefundAccountCardProps {
  hasAccount: boolean;
  bankName: string | null;
  accountNumberMasked: string | null;
  accountHolder: string | null;
}

export function RefundAccountCard({
  hasAccount,
  bankName,
  accountNumberMasked,
  accountHolder,
}: RefundAccountCardProps) {
  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        borderRadius: "4px",
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          환불 계좌
        </h2>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          수정
        </Link>
      </header>

      {hasAccount ? (
        // 계좌 있음: 은행 + 마스킹 번호 + 예금주
        <div
          className="flex items-center gap-3 text-sm"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-primary)" }}
          >
            account_balance
          </span>
          <div>
            <p className="font-medium">
              {bankName || "-"} {accountNumberMasked || "-"}
            </p>
            {accountHolder && (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                예금주 {accountHolder}
              </p>
            )}
          </div>
        </div>
      ) : (
        // 계좌 없음 안내
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base">
            account_balance_wallet
          </span>
          등록된 계좌가 없어요
        </div>
      )}
    </section>
  );
}
