/**
 * ═════════════════════════════════════════════════════════════════════════════
 * scripts/verify-cafe-sync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 다음카페 sync 품질 검증봇 — "silent 품질 저하" 자동 감지.
 *
 * 설계 문서:
 *   .claude/scratchpad-cafe-sync.md
 *     "📋 카페 sync 품질 검증봇 설계안 (2026-04-21, planner-architect)"
 *
 * 감지 대상:
 *   - 수집 0건 (cafe_posts.created_at 24h 공백)
 *   - 파싱 전부 실패 (games.metadata 필수필드 미채움)
 *   - cron 실패 누적 (18/18 중 다수 실패)
 *   - 쿠키 만료 임박 (Secret updated_at 7일 초과)
 *   - 게시판별 편차 (특정 fldid 0건 = 차단 의심)
 *
 * 사용법:
 *   # 로컬 dry-run (콘솔 출력, Issue 생성 없음)
 *   npx tsx --env-file=.env --env-file=.env.local scripts/verify-cafe-sync.ts --since=24h --dry-run
 *
 *   # JSON 출력만 (workflow 에서 사용)
 *   npx tsx scripts/verify-cafe-sync.ts --since=24h --output=json --dry-run
 *
 *   # 2주차 이후 실제 Issue 생성
 *   npx tsx scripts/verify-cafe-sync.ts --since=24h --execute-issues
 *
 * 안전장치:
 *   - 운영 DB 가드 (bwoorsgoijvlgutkrcvs 식별자 필수)
 *   - Secret 값 로그 출력 0 (메타데이터만 조회)
 *   - DB 는 읽기 전용 (쓰기 쿼리 없음)
 *   - 기본값 dry-run (--execute-issues 명시 필요)
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from "@prisma/client";
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// 상수 (설계안 "지표 & 임계치 확정" 테이블과 일치)
// ─────────────────────────────────────────────────────────────────────────────

/** 개발 DB 식별자 (cafe-sync.yml / upsert.ts 와 동일 관습) */
const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

/** cafe-sync workflow ID (설계안 사전 실측값, 2026-04-20) */
const CAFE_SYNC_WORKFLOW_ID = "263601935";

/** 쿠키 Secret 이름 (refresh-cafe-cookie.ts 와 동일 규약) */
const COOKIE_SECRET_NAME = "DAUM_CAFE_STORAGE_STATE_B64";

/** storageState fallback 경로 */
const STORAGE_STATE_PATH = resolve(process.cwd(), ".auth/cafe-state.json");

/** Issue 중복 방지 HTML 주석 마커 prefix */
const ISSUE_MARKER_PREFIX = "<!-- bot:cafe-sync-verify";

/** 자동 생성 라벨 (설계안 #E 색상 규약) */
const LABELS = {
  base: { name: "cafe-sync-verify", color: "0E8A16", description: "카페 sync 품질 검증봇" },
  automated: { name: "automated", color: "C5DEF5", description: "자동 생성" },
  warn: { name: "severity:warn", color: "FBCA04", description: "관찰 필요" },
  alert: { name: "severity:alert", color: "D93F0B", description: "즉시 조치" },
} as const;

type Severity = "ok" | "warn" | "alert" | "unknown" | "disabled_phase1";

// ─────────────────────────────────────────────────────────────────────────────
// CLI 파싱
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
/** 기준 기간 — "24h" / "48h" / "7d" 지원. 초단위 반환. */
function parseSince(token: string | undefined): { hours: number; raw: string } {
  const raw = token ?? "24h";
  const m = raw.match(/^(\d+)([hd])$/);
  if (!m) throw new Error(`--since 포맷 오류: "${raw}". 예: 24h / 48h / 7d`);
  const n = Number(m[1]);
  const hours = m[2] === "d" ? n * 24 : n;
  return { hours, raw };
}

const SINCE = parseSince(argv.find((a) => a.startsWith("--since="))?.split("=")[1]);
/** dry-run = Issue 생성 0 (기본값 true — 1주차 안전) */
const DRY_RUN = argv.includes("--dry-run") || !argv.includes("--execute-issues");
/** 출력 모드 */
const OUTPUT = (argv.find((a) => a.startsWith("--output="))?.split("=")[1] ?? "console") as
  | "console"
  | "json";
/** 로컬 모드: GH API 스킵 (gh 미설치 환경) */
const SKIP_GITHUB_API = argv.includes("--skip-github-api");
/** repo 자동 추출 or 명시 */
const REPO_ARG = argv.find((a) => a.startsWith("--repo="))?.split("=")[1];

// ─────────────────────────────────────────────────────────────────────────────
// 유틸: git remote 에서 owner/repo 자동 추출 (refresh-cafe-cookie.ts 동일 패턴)
// ─────────────────────────────────────────────────────────────────────────────

function detectRepoFromGitRemote(): string | null {
  try {
    const url = execSync("git config --get remote.origin.url", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    const m = url.match(/github\.com[/:]([^/]+\/[^/]+?)(\.git)?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const REPO = REPO_ARG ?? detectRepoFromGitRemote();

// ─────────────────────────────────────────────────────────────────────────────
// 유틸: 운영 DB 가드 (sync-cafe.ts / upsert.ts 와 동일 관습)
// ─────────────────────────────────────────────────────────────────────────────

function assertDevDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    console.error("❌ DATABASE_URL 미설정");
    process.exit(1);
  }
  if (!url.includes(DEV_DB_IDENTIFIER)) {
    console.error(`❌ 개발 DB 아님 (${DEV_DB_IDENTIFIER} 미포함). 운영 DB 접근 차단.`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸: gh CLI 래퍼 (Secret 값 노출 방지용 stderr 캡처)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * gh 명령 실행 — 성공 시 stdout, 실패 시 null.
 *
 * 이유:
 *   - Windows cmd 는 `?` `&` `>` 를 특수문자로 해석 → URL 쿼리스트링 깨짐
 *   - spawnSync + shell:true 조합에서는 args 가 공백 join 후 cmd 에 전달됨
 *   - 따라서 Windows 에서는 URL/특수문자 포함 인자를 **수동으로 더블쿼터**로 감싼다
 *   - 리눅스 CI(ubuntu-latest)는 shell:false 로 args 배열 직접 전달 → 이스케이프 불필요
 *
 * Secret 보안: args 는 로그 X (stderr 첫 줄만 기록).
 */
function ghExec(args: string[]): string | null {
  const isWin = process.platform === "win32";
  // Windows: 특수문자(`&`, `?`, `>`, 공백) 포함 인자 자동 쿼터링
  const quotedArgs = isWin
    ? args.map((a) => {
        if (/[&?><|"^ ]/.test(a) && !a.startsWith('"')) {
          // 이미 내부에 " 가 있으면 escape
          return `"${a.replace(/"/g, '\\"')}"`;
        }
        return a;
      })
    : args;
  const r = spawnSync("gh", quotedArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: isWin, // Windows 에서 gh.exe 경로 탐색
    windowsVerbatimArguments: false,
  });
  if (r.status !== 0 || r.error) {
    const msg = (r.stderr ?? r.error?.message ?? "unknown").toString().split("\n")[0];
    console.error(`  [gh 실패] ${args[0]} ${args[1] ?? ""} → ${msg}`);
    return null;
  }
  return r.stdout.toString();
}

function ghAvailable(): boolean {
  try {
    // spawnSync 로 Windows 에서도 gh.exe 탐색 가능
    const r = spawnSync("gh", ["--version"], {
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    return r.status === 0;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 지표 타입 & 판정 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

interface IndicatorResult {
  value: unknown;
  status: Severity;
  threshold?: unknown;
  note?: string;
  extra?: Record<string, unknown>;
}

/** 값 → 임계치 기반 severity 판정 */
function thresholdStatus(
  value: number,
  th: { ok: number; warnBelow: number; alertBelow: number },
): Severity {
  // 값이 ok 기준치 이상이면 ok
  if (value >= th.ok) return "ok";
  // warnBelow 이상이면 warn (즉 [warnBelow, ok) 구간)
  if (value >= th.warnBelow) return "warn";
  // 그 아래는 alert
  return "alert";
}

// ─────────────────────────────────────────────────────────────────────────────
// I1: 24h 신규 cafe_posts 건수
// ─────────────────────────────────────────────────────────────────────────────

async function queryI1NewPosts(prisma: PrismaClient, sinceHours: number): Promise<IndicatorResult> {
  // 이유: cafe_posts 는 sync-cafe 수집 이력의 source of truth. created_at 인덱스 존재.
  const rows = await prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(*)::bigint cnt FROM cafe_posts
     WHERE created_at > NOW() - ($1 || ' hours')::interval`,
    String(sinceHours),
  );
  const cnt = Number(rows[0]?.cnt ?? 0);
  // 임계치: 정상 5+ / 경고 1~4 / 알림 0
  const status: Severity = cnt >= 5 ? "ok" : cnt >= 1 ? "warn" : "alert";
  return {
    value: cnt,
    status,
    threshold: { ok: ">=5", warn: "1~4", alert: "0" },
    note: cnt === 0 ? "지난 24h 수집 0건 — cron 전체 실패 또는 쿠키 만료 의심" : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// I2: 24h 파싱 성공률
// ─────────────────────────────────────────────────────────────────────────────

async function queryI2ParseRate(prisma: PrismaClient, sinceHours: number): Promise<IndicatorResult> {
  // 이유: games.metadata.cafe_dataid 존재 = 카페 출처. 필수필드 2개+ 채움 = 파싱 성공.
  //       venue_name / scheduled_at / fee_per_person(>0) 중 2개 이상.
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      total: bigint;
      has_venue: bigint;
      has_sched: bigint;
      has_fee: bigint;
      success: bigint;
    }>
  >(
    `SELECT
       COUNT(*)::bigint total,
       COUNT(*) FILTER (WHERE venue_name IS NOT NULL AND venue_name <> '')::bigint has_venue,
       COUNT(*) FILTER (WHERE scheduled_at IS NOT NULL)::bigint has_sched,
       COUNT(*) FILTER (WHERE fee_per_person IS NOT NULL AND fee_per_person > 0)::bigint has_fee,
       COUNT(*) FILTER (
         WHERE (
           (CASE WHEN venue_name IS NOT NULL AND venue_name <> '' THEN 1 ELSE 0 END) +
           (CASE WHEN scheduled_at IS NOT NULL THEN 1 ELSE 0 END) +
           (CASE WHEN fee_per_person IS NOT NULL AND fee_per_person > 0 THEN 1 ELSE 0 END)
         ) >= 2
       )::bigint success
     FROM games
     WHERE metadata ? 'cafe_dataid'
       AND created_at > NOW() - ($1 || ' hours')::interval`,
    String(sinceHours),
  );
  const total = Number(rows[0]?.total ?? 0);
  const success = Number(rows[0]?.success ?? 0);

  if (total === 0) {
    // 24h 내 카페 출처 games 없음 — I1 이 이미 잡을 문제. I2 는 "unknown".
    return {
      value: null,
      status: "unknown",
      threshold: { ok: ">=85%", warn: "60~84%", alert: "<60%" },
      note: "24h 내 카페 출처 games 0건 — I1 참조",
      extra: { total, success },
    };
  }

  const rate = success / total;
  // 임계치: 정상 85%+ / 경고 60~84% / 알림 <60%
  const status: Severity = rate >= 0.85 ? "ok" : rate >= 0.6 ? "warn" : "alert";
  return {
    value: Number(rate.toFixed(3)),
    status,
    threshold: { ok: ">=0.85", warn: "0.60~0.84", alert: "<0.60" },
    extra: {
      total,
      success,
      has_venue: Number(rows[0]!.has_venue),
      has_scheduled_at: Number(rows[0]!.has_sched),
      has_fee: Number(rows[0]!.has_fee),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// I3: 24h cron 성공률 (GH API)
// ─────────────────────────────────────────────────────────────────────────────

function queryI3CronRate(sinceHours: number): IndicatorResult {
  if (SKIP_GITHUB_API || !REPO || !ghAvailable()) {
    return {
      value: null,
      status: "unknown",
      threshold: { ok: "18/18", warn: "15~17/18", alert: "<15/18" },
      note: "gh API 스킵 (로컬 모드 or gh 미설치)",
    };
  }
  // 이유: workflow_runs API 는 created>= ISO 시각 필터 지원. per_page=100 으로 충분.
  const sinceIso = new Date(Date.now() - sinceHours * 3600_000).toISOString();
  // bash 의 '>' 는 redirect 로 해석될 위험 → %3E 인코딩 필요 (gh api 는 URL 원형 전달)
  const runsJson = ghExec([
    "api",
    `repos/${REPO}/actions/workflows/${CAFE_SYNC_WORKFLOW_ID}/runs?created=%3E%3D${sinceIso}&per_page=100`,
  ]);
  if (!runsJson) {
    return {
      value: null,
      status: "unknown",
      threshold: { ok: "18/18", warn: "15~17/18", alert: "<15/18" },
      note: "gh API 호출 실패 (권한 부족 or 네트워크)",
    };
  }

  interface Run {
    conclusion: string | null;
    event: string;
    created_at: string;
  }
  let runs: Run[];
  try {
    runs = (JSON.parse(runsJson) as { workflow_runs: Run[] }).workflow_runs ?? [];
  } catch {
    return {
      value: null,
      status: "unknown",
      note: "workflow_runs 파싱 실패",
    };
  }
  // schedule 트리거만 집계 (workflow_dispatch 수동 실행은 cron 성공률에서 제외)
  const scheduledRuns = runs.filter((r) => r.event === "schedule");
  const total = scheduledRuns.length;
  const success = scheduledRuns.filter((r) => r.conclusion === "success").length;

  if (total === 0) {
    return {
      value: "0/0",
      status: "unknown",
      threshold: { ok: "18/18", warn: "15~17/18", alert: "<15/18" },
      note: "24h 내 schedule 실행 기록 없음 — workflow 비활성 의심",
    };
  }
  // 임계치: 정상 18/18 / 경고 15~17/18 / 알림 <15/18
  // 일반화: success >= 18 → ok / >=15 → warn / else alert (24h 기대치 기준)
  const status: Severity = success >= 18 ? "ok" : success >= 15 ? "warn" : "alert";
  return {
    value: `${success}/${total}`,
    status,
    threshold: { ok: "18+/18", warn: "15~17/18", alert: "<15/18" },
    extra: { success, total, triggered: "schedule_only" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// I4: 쿠키 나이 (GH API → storageState fallback)
// ─────────────────────────────────────────────────────────────────────────────

function queryI4CookieAge(): IndicatorResult {
  // 1차: GH API Secret updated_at (값 0 노출, 메타만)
  if (!SKIP_GITHUB_API && REPO && ghAvailable()) {
    const secJson = ghExec([
      "api",
      `repos/${REPO}/actions/secrets/${COOKIE_SECRET_NAME}`,
    ]);
    if (secJson) {
      try {
        const meta = JSON.parse(secJson) as { updated_at?: string; created_at?: string };
        const updatedAt = meta.updated_at ?? meta.created_at;
        if (updatedAt) {
          const ageDays = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
          // 임계치: 정상 <5일 / 경고 5~6일 / 알림 7일+
          const status: Severity =
            ageDays < 5 ? "ok" : ageDays < 7 ? "warn" : "alert";
          return {
            value: Number(ageDays.toFixed(1)),
            status,
            threshold: { ok: "<5", warn: "5~6", alert: ">=7" },
            extra: { source: "secret_updated_at", updated_at: updatedAt },
          };
        }
      } catch {
        // fallback 진입
      }
    }
  }

  // 2차 fallback: storageState cookies[].expires 최솟값 → 만료까지 남은 일수 계산
  // 이 경우 지표 의미가 반전 (작을수록 위험) — 설계안 R3 참조
  if (existsSync(STORAGE_STATE_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(STORAGE_STATE_PATH, "utf8")) as {
        cookies?: Array<{ expires?: number; domain?: string }>;
      };
      const daumCookies = (parsed.cookies ?? []).filter((c) => {
        const d = c.domain ?? "";
        return d.endsWith(".daum.net") || d === "m.cafe.daum.net" || d === "daum.net";
      });
      const expiresArr = daumCookies
        .map((c) => c.expires ?? -1)
        .filter((e) => e > 0);
      if (expiresArr.length > 0) {
        const minExpires = Math.min(...expiresArr);
        const nowSec = Date.now() / 1000;
        const daysLeft = (minExpires - nowSec) / 86_400;
        // 만료까지 <2일 = alert / 2~5일 = warn / 5+ = ok (반전 의미)
        const status: Severity =
          daysLeft < 2 ? "alert" : daysLeft < 5 ? "warn" : "ok";
        return {
          value: Number(daysLeft.toFixed(1)),
          status,
          threshold: { ok: ">=5일 남음", warn: "2~5일 남음", alert: "<2일 남음" },
          note: "Secret updated_at 접근 실패 → storageState expires fallback 사용",
          extra: { source: "storage_state_expires_days_left" },
        };
      }
    } catch {
      // 무시하고 unknown 반환
    }
  }

  return {
    value: null,
    status: "unknown",
    threshold: { ok: "<5일", warn: "5~6일", alert: ">=7일" },
    note: "Secret API 및 storageState fallback 모두 실패",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// I5: placeholder (1주차 비활성)
// ─────────────────────────────────────────────────────────────────────────────

function queryI5Placeholder(): IndicatorResult {
  return {
    value: null,
    status: "disabled_phase1",
    note: "1주차 비활성. 2주차부터 artifact 로그 파싱으로 403/429 직접 집계 검토.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// I6: 게시판별 편차
// ─────────────────────────────────────────────────────────────────────────────

async function queryI6BoardDispersion(
  prisma: PrismaClient,
  sinceHours: number,
): Promise<IndicatorResult> {
  // 이유: games.metadata.cafe_board 로 게시판별 수집 건수 확인. 특정 fldid 차단 감지.
  const rows = await prisma.$queryRawUnsafe<Array<{ board: string; cnt: bigint }>>(
    `SELECT metadata->>'cafe_board' AS board, COUNT(*)::bigint cnt
     FROM games
     WHERE metadata ? 'cafe_dataid'
       AND created_at > NOW() - ($1 || ' hours')::interval
     GROUP BY metadata->>'cafe_board'`,
    String(sinceHours),
  );

  const expectedBoards = ["IVHA", "Dilr", "MptT"] as const;
  const perBoard: Record<string, number> = {};
  for (const b of expectedBoards) perBoard[b] = 0;
  for (const r of rows) {
    if (r.board) perBoard[r.board] = Number(r.cnt);
  }
  const activeCount = expectedBoards.filter((b) => perBoard[b] > 0).length;

  // 임계치: 3/3 ok / 2/3 warn / 1개 이하 alert
  const status: Severity = activeCount === 3 ? "ok" : activeCount === 2 ? "warn" : "alert";
  return {
    value: `${activeCount}/3`,
    status,
    threshold: { ok: "3/3 활성", warn: "2/3", alert: "<=1/3" },
    extra: { per_board: perBoard },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 전체 severity 판정 (disabled_phase1 / unknown 은 제외)
// ─────────────────────────────────────────────────────────────────────────────

function calcOverallSeverity(indicators: Record<string, IndicatorResult>): Severity {
  const effective = Object.values(indicators)
    .map((i) => i.status)
    .filter((s): s is "ok" | "warn" | "alert" => s === "ok" || s === "warn" || s === "alert");
  if (effective.some((s) => s === "alert")) return "alert";
  if (effective.some((s) => s === "warn")) return "warn";
  if (effective.length === 0) return "unknown";
  return "ok";
}

// ─────────────────────────────────────────────────────────────────────────────
// 추천 조치 생성 (지표별 메시지)
// ─────────────────────────────────────────────────────────────────────────────

function buildRecommendations(indicators: Record<string, IndicatorResult>): string[] {
  const recs: string[] = [];
  const i1 = indicators["I1_new_posts"];
  if (i1 && i1.status === "alert") {
    recs.push(
      "I1: 24h 수집 0건 — (1) `gh run list --workflow=cafe-sync --limit=5` 실패 여부 확인 (2) 쿠키 만료 여부 I4 참조 (3) 수동 재실행 `gh workflow run cafe-sync.yml`",
    );
  } else if (i1 && i1.status === "warn") {
    recs.push("I1: 수집 건수 저조 — 주말/공휴일 정상 패턴 가능. 3일 연속 warn 시 점검");
  }

  const i2 = indicators["I2_parse_rate"];
  if (i2 && i2.status === "alert") {
    recs.push(
      "I2: 파싱 성공률 60% 미만 — IVHA 본문 양식 변경 의심. `tmp/cafe-debug-article-IVHA-*.html` 덤프 생성 후 extract-fallbacks.ts 정규식 점검",
    );
  } else if (i2 && i2.status === "warn") {
    recs.push("I2: 파싱 성공률 85% 미만 — 게시판별 분포 확인 권장");
  }

  const i3 = indicators["I3_cron_success"];
  if (i3 && i3.status === "alert") {
    recs.push(
      "I3: cron 실패 누적 — Actions 탭에서 실패 run 로그 확인. 쿠키/네트워크/DB 연결 장애 구분 필요",
    );
  }

  const i4 = indicators["I4_cookie_age_days"];
  if (i4 && i4.status === "alert") {
    recs.push(
      "I4: 쿠키 만료 임박/초과 — 로컬에서 `npx tsx scripts/refresh-cafe-cookie.ts` 실행하여 재발급",
    );
  } else if (i4 && i4.status === "warn") {
    recs.push("I4: 쿠키 5~6일차 — 7일 이내 재발급 계획 수립");
  }

  const i6 = indicators["I6_board_coverage"];
  if (i6 && (i6.status === "alert" || i6.status === "warn")) {
    const perBoard = (i6.extra?.per_board ?? {}) as Record<string, number>;
    const zeros = Object.entries(perBoard)
      .filter(([, v]) => v === 0)
      .map(([k]) => k);
    if (zeros.length > 0) {
      recs.push(
        `I6: ${zeros.join("/")} 게시판 0건 — fldid 차단 or HTML 구조 변경 의심. 로컬에서 \`sync-cafe.ts --board=${zeros[0]} --article-limit=3\` 재현`,
      );
    }
  }

  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 결과 출력 (console / json)
// ─────────────────────────────────────────────────────────────────────────────

interface VerifyReport {
  run_at: string;
  since_hours: number;
  since_raw: string;
  severity: Severity;
  repo: string | null;
  dry_run: boolean;
  indicators: Record<string, IndicatorResult>;
  recommendations: string[];
  github_run_url: string | null;
}

function printConsole(report: VerifyReport): void {
  const sev = report.severity;
  const icon = sev === "ok" ? "✅" : sev === "warn" ? "⚠️" : sev === "alert" ? "🚨" : "❓";
  console.log();
  console.log(`${icon} 전체 severity: ${sev.toUpperCase()}`);
  console.log(`   기간: 최근 ${report.since_raw} · repo: ${report.repo ?? "(미감지)"}`);
  console.log(`   모드: ${report.dry_run ? "dry-run (Issue 생성 0)" : "execute-issues"}`);
  console.log();
  console.log("📊 지표:");
  for (const [key, r] of Object.entries(report.indicators)) {
    const s = r.status;
    const badge = s === "ok" ? "✅" : s === "warn" ? "⚠️" : s === "alert" ? "🚨"
      : s === "disabled_phase1" ? "⏸️" : "❓";
    const val = r.value === null ? "(n/a)" : String(r.value);
    console.log(`  ${badge} ${key.padEnd(22)} ${val.padEnd(10)} [${s}]`);
    if (r.note) console.log(`     └ ${r.note}`);
  }
  if (report.recommendations.length > 0) {
    console.log();
    console.log("💡 추천 조치:");
    for (const rec of report.recommendations) console.log(`  · ${rec}`);
  }
  console.log();
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub Issue 관리 (--execute-issues 모드만)
// ─────────────────────────────────────────────────────────────────────────────

/** 이슈 본문 Markdown 생성 */
function buildIssueBody(report: VerifyReport): string {
  const lines: string[] = [];
  lines.push(ISSUE_MARKER_PREFIX + ` date:${report.run_at.slice(0, 10)} -->`);
  lines.push("");
  lines.push("## 📊 지표 요약");
  lines.push("");
  lines.push("| 지표 | 값 | 상태 |");
  lines.push("|------|-----|------|");
  for (const [key, r] of Object.entries(report.indicators)) {
    const icon =
      r.status === "ok" ? "✅" : r.status === "warn" ? "⚠️" : r.status === "alert" ? "🚨"
      : r.status === "disabled_phase1" ? "⏸️" : "❓";
    const val = r.value === null ? "(n/a)" : String(r.value);
    lines.push(`| ${key} | ${val} | ${icon} ${r.status} |`);
  }
  if (report.recommendations.length > 0) {
    lines.push("");
    lines.push("## 🔧 추천 조치");
    lines.push("");
    for (const rec of report.recommendations) lines.push(`- ${rec}`);
  }
  lines.push("");
  lines.push("## 🔗 참조");
  if (report.github_run_url) lines.push(`- Verify 실행: ${report.github_run_url}`);
  if (report.repo)
    lines.push(`- 최근 cafe-sync 실행: https://github.com/${report.repo}/actions/workflows/cafe-sync.yml`);
  lines.push("- 설계: `.claude/scratchpad-cafe-sync.md` \"📋 카페 sync 품질 검증봇 설계안\"");
  lines.push("");
  lines.push("---");
  lines.push("*자동 생성 (scripts/verify-cafe-sync.ts)*");
  return lines.join("\n");
}

/** 4개 라벨이 없으면 생성 (idempotent) */
function ensureLabels(): void {
  if (!REPO) return;
  const existingRaw = ghExec(["api", `repos/${REPO}/labels?per_page=100`, "--paginate"]);
  if (!existingRaw) return;
  let existing: Array<{ name: string }> = [];
  try {
    existing = JSON.parse(existingRaw) as Array<{ name: string }>;
  } catch {
    return;
  }
  const existingNames = new Set(existing.map((l) => l.name));
  for (const label of Object.values(LABELS)) {
    if (existingNames.has(label.name)) continue;
    // gh label create 는 별도 서브커맨드. 실패해도 무시 (권한 부족 가능).
    // [R5 수정] 호출부에서 쿼터링 제거. ghExec() 의 Windows 분기가 특수문자 자동 쿼터,
    // Linux (spawnSync shell:false) 는 raw 인자 전달이 정상. 과거 `"${...}"` 이중 쿼터로
    // Linux CI 에서 라벨명에 리터럴 `"` 가 박히는 버그가 있었음 (reviewer R5, 2026-04-21).
    ghExec([
      "label",
      "create",
      label.name,
      "--color",
      label.color,
      "--description",
      label.description,
      "--repo",
      REPO,
    ]);
  }
}

/**
 * Issue 관리 메인 로직
 *  - severity=ok → 열린 cafe-sync-verify 이슈에 회복 코멘트 + close
 *  - severity=warn/alert → 같은 severity 열린 이슈 탐색 → 있으면 코멘트, 없으면 신규 생성
 */
function manageGithubIssues(report: VerifyReport): {
  created: number;
  commented: number;
  closed: number;
} {
  const stats = { created: 0, commented: 0, closed: 0 };
  if (!REPO || !ghAvailable()) {
    console.error("  ⚠️ gh CLI 또는 repo 정보 없음 — Issue 관리 스킵");
    return stats;
  }

  ensureLabels();

  const openIssuesRaw = ghExec([
    "issue",
    "list",
    "--repo",
    REPO,
    "--label",
    LABELS.base.name,
    "--state",
    "open",
    "--json",
    "number,title,body,labels",
    "--limit",
    "50",
  ]);
  let openIssues: Array<{ number: number; title: string; body: string; labels: Array<{ name: string }> }> = [];
  if (openIssuesRaw) {
    try {
      openIssues = JSON.parse(openIssuesRaw);
    } catch {
      openIssues = [];
    }
  }

  const verifyIssues = openIssues.filter((i) => i.body?.includes(ISSUE_MARKER_PREFIX));

  // 1) 회복 케이스: severity=ok → 열린 warn/alert 이슈 close
  if (report.severity === "ok") {
    for (const issue of verifyIssues) {
      const comment = `✅ 자동 회복 (${report.run_at.slice(0, 16).replace("T", " ")} KST)\n\n전체 severity=ok 복귀로 자동 close.`;
      const r = ghExec([
        "issue",
        "close",
        String(issue.number),
        "--repo",
        REPO,
        "--comment",
        // [R5 수정] raw 전달. ghExec() 의 Windows 분기가 자동 쿼터/escape 책임짐.
        comment,
      ]);
      if (r !== null) stats.closed++;
    }
    return stats;
  }

  // 2) warn/alert 케이스: 같은 severity 열린 이슈가 있으면 코멘트만, 없으면 신규 생성
  const sameSeverityIssues = verifyIssues.filter((i) =>
    i.labels.some((l) => l.name === (report.severity === "alert" ? LABELS.alert.name : LABELS.warn.name)),
  );

  if (sameSeverityIssues.length > 0) {
    // 가장 최근(번호 큰) 이슈에 코멘트 추가
    const target = sameSeverityIssues.sort((a, b) => b.number - a.number)[0];
    const commentBody = [
      `🔁 ${report.run_at.slice(0, 16).replace("T", " ")} KST 재감지`,
      "",
      "| 지표 | 값 | 상태 |",
      "|------|-----|------|",
      ...Object.entries(report.indicators).map(([k, r]) => {
        const v = r.value === null ? "(n/a)" : String(r.value);
        return `| ${k} | ${v} | ${r.status} |`;
      }),
    ].join("\n");
    // body 는 --body-file 로 stdin 전달할 수 없어 임시 파일 사용
    const tmpPath = resolve(process.cwd(), "tmp/_verify-comment.md");
    try {
      mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
      writeFileSync(tmpPath, commentBody, "utf8");
      const r = ghExec([
        "issue",
        "comment",
        String(target.number),
        "--repo",
        REPO,
        "--body-file",
        tmpPath,
      ]);
      if (r !== null) stats.commented++;
    } catch (e) {
      console.error(`  코멘트 작성 실패: ${(e as Error).message}`);
    }
    return stats;
  }

  // 3) 신규 이슈 생성
  const title = `[cafe-sync-verify] severity=${report.severity} · ${report.run_at.slice(0, 10)}`;
  const body = buildIssueBody(report);
  const bodyPath = resolve(process.cwd(), "tmp/_verify-body.md");
  try {
    mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
    writeFileSync(bodyPath, body, "utf8");
    const labelFlag =
      report.severity === "alert" ? LABELS.alert.name : LABELS.warn.name;
    const r = ghExec([
      "issue",
      "create",
      "--repo",
      REPO,
      "--title",
      // [R5 수정] raw 전달. ghExec() 의 Windows 분기가 자동 쿼터/escape 책임짐.
      title,
      "--body-file",
      bodyPath,
      "--label",
      LABELS.base.name,
      "--label",
      LABELS.automated.name,
      "--label",
      labelFlag,
    ]);
    if (r !== null) stats.created++;
  } catch (e) {
    console.error(`  Issue 생성 실패: ${(e as Error).message}`);
  }
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// 리포트 저장 (artifact 용)
// ─────────────────────────────────────────────────────────────────────────────

function saveReport(report: VerifyReport): string {
  const tmpDir = resolve(process.cwd(), "tmp");
  mkdirSync(tmpDir, { recursive: true });
  const ts = report.run_at.replace(/[:.]/g, "-").slice(0, 19);
  const filePath = resolve(tmpDir, `verify-report-${ts}.json`);
  writeFileSync(filePath, JSON.stringify(report, null, 2), "utf8");
  return filePath;
}

// ─────────────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  assertDevDatabase();

  // Prisma 연결 타임아웃 방지 — 30초 timeout for queries
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL! } },
  });

  const runAt = new Date().toISOString();
  const githubRunUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;

  try {
    // 지표 6종 집계 (DB 3종 병렬, GH API 2종 순차)
    const [i1, i2, i6] = await Promise.all([
      queryI1NewPosts(prisma, SINCE.hours),
      queryI2ParseRate(prisma, SINCE.hours),
      queryI6BoardDispersion(prisma, SINCE.hours),
    ]);
    const i3 = queryI3CronRate(SINCE.hours);
    const i4 = queryI4CookieAge();
    const i5 = queryI5Placeholder();

    const indicators: Record<string, IndicatorResult> = {
      I1_new_posts: i1,
      I2_parse_rate: i2,
      I3_cron_success: i3,
      I4_cookie_age_days: i4,
      I5_http_error_count: i5,
      I6_board_coverage: i6,
    };

    const severity = calcOverallSeverity(indicators);
    const recommendations = buildRecommendations(indicators);

    const report: VerifyReport = {
      run_at: runAt,
      since_hours: SINCE.hours,
      since_raw: SINCE.raw,
      severity,
      repo: REPO,
      dry_run: DRY_RUN,
      indicators,
      recommendations,
      github_run_url: githubRunUrl,
    };

    // 출력
    if (OUTPUT === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printConsole(report);
    }

    // artifact 저장 (항상)
    const reportPath = saveReport(report);
    if (OUTPUT !== "json") console.log(`💾 리포트 저장: ${reportPath}`);

    // Issue 관리 (--execute-issues 모드 + severity !== unknown)
    if (!DRY_RUN && severity !== "unknown") {
      if (OUTPUT !== "json") console.log("\n🔧 GitHub Issue 관리...");
      const stats = manageGithubIssues(report);
      if (OUTPUT !== "json") {
        console.log(`   created: ${stats.created} / commented: ${stats.commented} / closed: ${stats.closed}`);
      }
    } else if (DRY_RUN && OUTPUT !== "json") {
      console.log("🔒 dry-run 모드 — Issue 생성/코멘트/close 실행 안 함");
    }

    await prisma.$disconnect();
    // exit code: alert → 1, 그 외 → 0 (CI 가시성)
    process.exit(severity === "alert" ? 1 : 0);
  } catch (e) {
    await prisma.$disconnect();
    console.error("❌ verify 실행 중 에러:", (e as Error).message);
    process.exit(2);
  }
}

main();
