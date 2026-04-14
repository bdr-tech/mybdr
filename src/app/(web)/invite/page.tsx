import type { Metadata } from "next";
import Link from "next/link";

/**
 * 카페 초대 랜딩 페이지
 * 기존 네이버 카페 회원을 MyBDR 플랫폼으로 안내하는 정적 페이지.
 * SEO 최적화 + 가입 CTA.
 */

export const metadata: Metadata = {
  title: "MyBDR로 이사했어요! | MyBDR",
  description: "BDR 농구 커뮤니티가 MyBDR 플랫폼으로 이전했습니다. 더 편리한 경기 관리, 대회 운영, 팀 관리를 경험하세요.",
  openGraph: {
    title: "MyBDR로 이사했어요!",
    description: "BDR 농구 커뮤니티가 MyBDR 플랫폼으로 이전했습니다.",
  },
};

export default function InvitePage() {
  // 플랫폼 주요 기능 목록
  const features = [
    {
      icon: "sports_basketball",
      title: "경기 관리",
      desc: "픽업게임, 팀매치를 쉽게 만들고 참가하세요.",
    },
    {
      icon: "emoji_events",
      title: "대회 운영",
      desc: "대진표 자동 생성, 실시간 스코어 입력을 지원합니다.",
    },
    {
      icon: "groups",
      title: "팀 관리",
      desc: "팀을 만들고 멤버를 관리하세요. 팀 전적이 자동으로 기록됩니다.",
    },
    {
      icon: "location_on",
      title: "농구장 지도",
      desc: "전국 농구장 정보를 한눈에. 리뷰와 체크인도 가능합니다.",
    },
    {
      icon: "leaderboard",
      title: "랭킹 시스템",
      desc: "개인/팀 랭킹과 BDR 공식 랭킹을 확인하세요.",
    },
    {
      icon: "forum",
      title: "커뮤니티",
      desc: "자유게시판, 팀원 모집, 중고거래까지 한 곳에서.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section
        className="relative overflow-hidden py-12 sm:py-16 lg:py-24 px-4 sm:px-6"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), #FF6B35)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center relative z-10">
          {/* 아이콘 */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-md mb-6" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <span className="material-symbols-outlined text-3xl text-white">rocket_launch</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)" }}>
            MyBDR로 이사했어요!
          </h1>
          <p className="text-lg text-white/80 mb-2">
            BDR 농구 커뮤니티가 더 강력한 플랫폼으로 진화했습니다.
          </p>
          <p className="text-sm text-white/60 mb-8">
            카페에서 하던 모든 활동을 MyBDR에서 더 편리하게 이어가세요.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded text-base font-bold transition-all active:scale-95"
              style={{ backgroundColor: "#fff", color: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined">person_add</span>
              무료 가입하기
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded text-base font-medium transition-all active:scale-95"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              둘러보기
            </Link>
          </div>
        </div>

        {/* 배경 장식 원 */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />
      </section>

      {/* 무엇이 달라졌나요? */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
              무엇이 달라졌나요?
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              카페 게시판을 넘어, 농구에 최적화된 플랫폼입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border p-5 transition-all hover:shadow-md"
                style={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span
                  className="material-symbols-outlined text-2xl mb-3 block"
                  style={{ color: "var(--color-primary)" }}
                >
                  {f.icon}
                </span>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이전 안내 */}
      <section className="py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="material-symbols-outlined text-3xl mb-3 block"
            style={{ color: "var(--color-info)" }}
          >
            info
          </span>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            기존 카페 회원이신가요?
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            카페 계정과 MyBDR 계정은 별도입니다.
            새로 가입하시면 모든 기능을 이용할 수 있습니다.
          </p>
          <div className="space-y-2 text-left inline-block">
            {[
              "카페 닉네임과 동일하게 설정하면 기존 멤버들이 알아볼 수 있어요.",
              "팀 정보는 이미 이전되어 있습니다. 가입 후 팀에 합류하세요.",
              "궁금한 점은 커뮤니티에서 질문해 주세요.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: "var(--color-success, #22C55E)" }}>
                  check_circle
                </span>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
          지금 시작하세요
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          가입은 30초면 충분합니다.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded text-base font-bold transition-all active:scale-95"
          style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
        >
          <span className="material-symbols-outlined">person_add</span>
          무료 가입하기
        </Link>
      </section>
    </div>
  );
}
