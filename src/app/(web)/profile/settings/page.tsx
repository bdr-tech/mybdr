"use client";

/* ============================================================
 * ProfileSettingsPage — Settings v2 허브 (시안 6 섹션 + 좌측 sticky nav)
 *
 * 왜 (Phase 5):
 *  - BDR v2 시안 Settings.jsx 의 6 섹션 구조(account/profile/notify/privacy/billing/danger)를
 *    그대로 이식해 흩어진 설정 진입점을 한 페이지에 통합한다.
 *  - 기존 ?tab=preferences|notifications 외부 링크/북마크는 ?section= 로 폴백.
 *  - API/Prisma/서비스는 0 변경 — 신규 fetch도 추가하지 않고 이미 있던 호출만 사용.
 *
 * 어떻게:
 *  - 활성 섹션은 URL ?section=... 으로 관리 (새로고침/공유/뒤로가기 보존).
 *  - 좌측 220px sticky nav + 우측 카드. 모바일에서는 1열 스택.
 *  - 페이지 마운트 시 GET /api/web/profile + GET /api/web/profile/subscription 만 호출
 *    (notify 섹션은 내부에서 GET notification-settings 1회 — v1 동일 패턴).
 *  - 비활성 섹션은 조건부 렌더 안 함(=mount 안 함) 으로 무거운 sub fetch 회피.
 * ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SettingsSideNavV2 } from "./_components_v2/settings-side-nav-v2";
import { resolveSection, type SectionKey } from "./_components_v2/section-key";
import { AccountSectionV2 } from "./_components_v2/account-section-v2";
import {
  ProfileSectionV2,
  type ProfileFormUser,
} from "./_components_v2/profile-section-v2";
import { NotifySectionV2 } from "./_components_v2/notify-section-v2";
import { PrivacySectionV2 } from "./_components_v2/privacy-section-v2";
import {
  BillingSectionV2,
  type BillingSummary,
} from "./_components_v2/billing-section-v2";
import { DangerSectionV2 } from "./_components_v2/danger-section-v2";

// 섹션 사이에 공유되는 사용자 요약 (account/profile/billing 에 사용)
interface ProfileApiUser extends ProfileFormUser {
  email?: string | null;
}

// 단일 정수 → "₩4,900" 같은 표시 — Intl 사용 (브라우저 내장)
function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

// 만료일 ISO → "YYYY.MM.DD"
function formatYMD(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 활성 섹션: ?section= 우선, ?tab= 폴백, 기본 account
  const rawSection = searchParams.get("section");
  const rawTab = searchParams.get("tab");
  const activeSection: SectionKey = resolveSection(rawSection, rawTab);

  const handleSectionChange = useCallback(
    (id: SectionKey) => {
      // history 누적 방지 + 스크롤 점프 방지
      router.replace(`/profile/settings?section=${id}`, { scroll: false });
    },
    [router],
  );

  /* ----------- 공유 데이터 (account/profile/billing 사용) ----------- */
  const [user, setUser] = useState<ProfileApiUser | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let aborted = false;

    // 두 GET 병렬. 신규 추가 fetch 0건 — 이미 시스템에 있던 라우트.
    Promise.all([
      fetch("/api/web/profile", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/profile/subscription", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([profileData, subData]) => {
      if (aborted) return;

      // 1) profile 응답 파싱 — apiSuccess 가 snake_case 직렬화
      if (profileData?.user) {
        const u = profileData.user as Record<string, unknown>;
        setUser({
          email: (u.email as string | null) ?? null,
          nickname: (u.nickname as string | null) ?? null,
          name: (u.name as string | null) ?? null,
          position: (u.position as string | null) ?? null,
          height: (u.height as number | null) ?? null,
          weight: (u.weight as number | null) ?? null,
          city: (u.city as string | null) ?? null,
          district: (u.district as string | null) ?? null,
          birth_date: (u.birth_date as string | null) ?? null,
          bio: (u.bio as string | null) ?? null,
        });
      }

      // 2) subscription 응답 파싱 — 활성/유효한 구독 1건 추출
      if (subData?.subscriptions && Array.isArray(subData.subscriptions)) {
        type SubItem = {
          plan: { name: string; price?: number | null };
          status: string;
          expires_at: string | null;
          is_usable: boolean;
        };
        const items = subData.subscriptions as SubItem[];
        // is_usable 인 것 중 가장 최근. 없으면 무료 플랜 표기.
        const usable = items.find((s) => s.is_usable);
        if (usable) {
          const priceStr =
            typeof usable.plan.price === "number"
              ? `${formatKRW(usable.plan.price)}/월 · `
              : "";
          const ymd = formatYMD(usable.expires_at);
          const caption = `${priceStr}${ymd ? `다음 결제 ${ymd}` : "활성 구독"}`;
          setBilling({
            plan_label: usable.plan.name,
            next_billing_caption: caption,
            is_paid_member: true,
            payment_method_masked: null, // DB 미지원
          });
        } else {
          setBilling({
            plan_label: "BDR 베이직",
            next_billing_caption: "무료 플랜 사용 중",
            is_paid_member: false,
            payment_method_masked: null,
          });
        }
      } else {
        setBilling({
          plan_label: "BDR 베이직",
          next_billing_caption: "무료 플랜 사용 중",
          is_paid_member: false,
          payment_method_masked: null,
        });
      }

      setLoaded(true);
    });

    return () => {
      aborted = true;
    };
  }, []);

  // profile 섹션 저장 후 화면 동기화 (header email 등은 유지)
  const handleProfileSaved = useCallback((next: ProfileFormUser) => {
    setUser((prev) => (prev ? { ...prev, ...next } : prev));
  }, []);

  return (
    <div className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* ============== 페이지 헤더 (시안 eyebrow + h1 + 캡션) ============== */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">설정 · SETTINGS</div>
          <h1
            style={{
              margin: "6px 0 2px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            환경 설정
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            계정, 알림, 공개 범위를 관리합니다
          </div>
        </div>

        {/* ============== 좌측 sticky nav + 우측 카드 ============== */}
        <div
          style={{
            display: "grid",
            // 시안: 220 1fr. 모바일에서는 1열 스택.
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 24,
            alignItems: "flex-start",
          }}
          className="settings-grid-v2"
        >
          <SettingsSideNavV2
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />

          <div
            className="card"
            style={{ padding: "24px 28px", minWidth: 0 }}
            // 우측 카드: 시안의 padding 24/28
          >
            {/* 비활성 섹션은 mount 안 함 → 불필요한 fetch/렌더 회피 */}
            {activeSection === "account" && (
              // user 가 아직 도착 안 했으면 자리 표시
              <AccountSectionV2 user={loaded ? user : null} />
            )}
            {activeSection === "profile" && (
              <ProfileSectionV2
                user={loaded ? user : null}
                onSaved={handleProfileSaved}
              />
            )}
            {activeSection === "notify" && <NotifySectionV2 />}
            {activeSection === "privacy" && <PrivacySectionV2 />}
            {activeSection === "billing" && (
              <BillingSectionV2 summary={loaded ? billing : null} />
            )}
            {activeSection === "danger" && <DangerSectionV2 />}
          </div>
        </div>
      </div>

      {/* ============== 반응형: 768px+ 에서 2열로 ============== */}
      <style jsx>{`
        @media (min-width: 768px) {
          .settings-grid-v2 {
            grid-template-columns: 220px minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
