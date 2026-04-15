import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { BOT_EMAIL_DOMAIN } from "@/lib/healthcheck/is-bot";

/**
 * Vercel Cron: 심판 플랫폼 헬스체크 (매시간).
 *
 * 이유: 실사용 유저 경로를 봇 계정으로 자동 재현하여
 *       DB/캐시/인증/핵심 API/보안 가드 8개 항목을 주기적으로 점검.
 *       결과는 HealthCheckRun + HealthCheckResult 테이블에 누적 → 대시보드(3차)에서 조회.
 *
 * 스케줄: vercel.json "0 * * * *" (매시간 0분)
 * 보안:   CRON_SECRET Bearer 인증 (다른 cron과 동일 패턴)
 * 성능:   8개 점검을 Promise.allSettled로 병렬 + 각 5초 timeout
 *         → Vercel 함수 제한(Hobby 10초 / Pro 60초) 안에서 안전하게 종료
 *
 * 로그인 점검(check3) 특이사항:
 *   프로젝트의 이메일/비밀번호 로그인은 Server Action으로만 존재하고
 *   JSON API 엔드포인트가 없어 self-fetch 불가. 따라서 로그인의 핵심 검증 단계
 *   (User 조회 + bcrypt 검증 + JWT 발급)를 cron 내부에서 직접 실행하여
 *   "봇 비밀번호가 유효하고 JWT 발급이 정상 동작하는지"를 확인한다.
 *   발급된 토큰은 WEB_SESSION_COOKIE 이름으로 포장하여 이후 check4/6/8의 쿠키로 재사용.
 */

// --- 타입 정의 ---

type CheckCategory = "db" | "cache" | "auth" | "api" | "security";

interface CheckResult {
  category: CheckCategory;
  name: string;
  target_url?: string;
  passed: boolean;
  status_code?: number;
  duration_ms: number;
  error_message?: string;
}

// --- 유틸 ---

/**
 * Promise.race로 개별 체크에 timeout을 강제.
 * 이유: Vercel 함수 전체 타임아웃(10초/60초) 안에 들어오도록
 *       각 점검이 5초 안에 실패 or 성공 하도록 제한.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  // 타이머 핸들을 보관해 두었다가 race 승부가 난 뒤 finally에서 해제한다.
  // 이유: promise가 먼저 성공/실패해도 setTimeout은 살아있어 이벤트 루프에
  //       붙어있기 때문에 메모리 누수 + 서버리스 함수 종료 지연 원인이 됨.
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * 에러 메시지를 1000자로 슬라이스.
 * 이유: @db.Text이지만 스택트레이스가 수 KB ~ 수십 KB까지 커질 수 있어
 *       DB 비대화 방지 + 로그 가독성 확보.
 */
function sliceError(err: unknown): string {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return msg.slice(0, 1000);
}

/**
 * self-fetch baseUrl 결정.
 * 우선순위: APP_URL > VERCEL_URL > 요청 자체의 origin
 */
function resolveBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.nextUrl.origin;
}

/**
 * 봇 이메일로 User 조회 (User.email 봇 서픽스 기반).
 * 이유: 봇 계정의 id 하드코딩 회피. 개발 DB 리셋 시 id가 바뀌어도
 *       이메일 서픽스는 고정이므로 견고.
 */
async function findBotUser(subject: "bot-admin" | "bot-referee") {
  const email = `${subject}${BOT_EMAIL_DOMAIN}`;
  return prisma.user.findUnique({ where: { email } });
}

// --- 8개 점검 함수 ---

/**
 * check1: DB 연결 확인 (Postgres ping).
 * prisma.$queryRaw로 SELECT 1 한 번만 — 가장 기본적인 "DB 살아있나"
 */
async function check1DbPing(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      category: "db",
      name: "db_ping",
      passed: true,
      duration_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      category: "db",
      name: "db_ping",
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

/**
 * check2: Redis(Upstash) ping.
 * REST API로 /ping 호출 — 토큰 없거나 URL 없으면 skip(passed=false로 기록).
 */
async function check2RedisPing(): Promise<CheckResult> {
  const start = Date.now();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return {
      category: "cache",
      name: "redis_ping",
      passed: false,
      duration_ms: Date.now() - start,
      error_message: "UPSTASH_REDIS_REST_URL/TOKEN 미설정",
    };
  }
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const passed = res.ok;
    return {
      category: "cache",
      name: "redis_ping",
      target_url: `${url}/ping`,
      passed,
      status_code: res.status,
      duration_ms: Date.now() - start,
      error_message: passed ? undefined : `status=${res.status}`,
    };
  } catch (err) {
    return {
      category: "cache",
      name: "redis_ping",
      target_url: `${url}/ping`,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

/**
 * 봇 계정 로그인 내부 실행.
 * 이유: Server Action이라 self-fetch 불가. loginAction 핵심 로직(user 조회 +
 *       bcrypt 검증 + generateToken) 3단계를 직접 재현.
 * 반환: { passed, statusCode(200/401/500), cookie(성공 시 "bdr_session=JWT") }
 */
async function performBotLogin(
  subject: "bot-admin" | "bot-referee"
): Promise<{ passed: boolean; statusCode: number; cookie: string | null; error?: string }> {
  try {
    const user = await findBotUser(subject);
    if (!user || !user.passwordDigest) {
      return { passed: false, statusCode: 401, cookie: null, error: "봇 계정 없음" };
    }
    if (user.status !== "active") {
      return { passed: false, statusCode: 401, cookie: null, error: `계정 상태=${user.status}` };
    }
    const password = process.env.BOT_DEFAULT_PASSWORD;
    if (!password) {
      return { passed: false, statusCode: 500, cookie: null, error: "BOT_DEFAULT_PASSWORD 미설정" };
    }
    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      return { passed: false, statusCode: 401, cookie: null, error: "비밀번호 불일치" };
    }
    // 실제 로그인 경로와 동일한 generateToken 사용
    const token = await generateToken(user);
    // withWebAuth가 쿠키에서 읽을 이름으로 포장
    const cookie = `${WEB_SESSION_COOKIE}=${token}`;
    return { passed: true, statusCode: 200, cookie };
  } catch (err) {
    return { passed: false, statusCode: 500, cookie: null, error: sliceError(err) };
  }
}

/**
 * check3: 봇 Admin 로그인 (내부).
 * 동시에 봇 Referee 로그인도 수행하여 후속 check4/6/8에 재사용할 쿠키 확보.
 * 2개 로그인이 모두 성공해야 passed=true.
 * → 반환 시 { result, adminCookie, refereeCookie } 구조로 상위에서 후속 체크에 전달.
 */
async function check3BotLogin(): Promise<{
  result: CheckResult;
  adminCookie: string | null;
  refereeCookie: string | null;
}> {
  const start = Date.now();
  // 병렬로 두 봇 계정 로그인
  const [admin, referee] = await Promise.all([
    performBotLogin("bot-admin"),
    performBotLogin("bot-referee"),
  ]);
  const passed = admin.passed && referee.passed;
  const errors: string[] = [];
  if (!admin.passed) errors.push(`admin: ${admin.error ?? "실패"}`);
  if (!referee.passed) errors.push(`referee: ${referee.error ?? "실패"}`);

  return {
    result: {
      category: "auth",
      name: "bot_login",
      passed,
      status_code: passed ? 200 : Math.max(admin.statusCode, referee.statusCode),
      duration_ms: Date.now() - start,
      error_message: passed ? undefined : errors.join(" | "),
    },
    adminCookie: admin.cookie,
    refereeCookie: referee.cookie,
  };
}

/**
 * 공통 self-fetch 헬퍼.
 * 쿠키가 필요한 check의 공통 로직 — status 확인 + 응답 시간 측정.
 */
async function fetchCheck(args: {
  category: CheckCategory;
  name: string;
  url: string;
  cookie: string | null;
  expectStatus: number;
}): Promise<CheckResult> {
  const start = Date.now();
  const { category, name, url, cookie, expectStatus } = args;
  if (cookie === null && expectStatus !== 401) {
    // 401 점검(비인증)이 아닌데 쿠키가 없음 → 로그인 실패로 인한 skip
    return {
      category,
      name,
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: "cookie_unavailable (check3 실패 여파)",
    };
  }
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(url, { headers, cache: "no-store" });
    const passed = res.status === expectStatus;
    // 실패 시 응답 본문 일부만 읽어서 error_message에 포함 (대용량 페이지 방지)
    let errorBody: string | undefined;
    if (!passed) {
      try {
        const text = await res.text();
        errorBody = text.slice(0, 500);
      } catch {
        // 본문 읽기 실패는 무시
      }
    }
    return {
      category,
      name,
      target_url: url,
      passed,
      status_code: res.status,
      duration_ms: Date.now() - start,
      error_message: passed
        ? undefined
        : `expected=${expectStatus} actual=${res.status}${errorBody ? " body=" + errorBody : ""}`,
    };
  } catch (err) {
    return {
      category,
      name,
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

/**
 * check4: GET /api/web/referees/me (봇 Referee 쿠키).
 * 심판 본인 조회 API — 로그인 + DB 조회 + Referee 매칭 정상 확인.
 */
async function check4RefereeMe(baseUrl: string, cookie: string | null): Promise<CheckResult> {
  return fetchCheck({
    category: "api",
    name: "referees_me",
    url: `${baseUrl}/api/web/referees/me`,
    cookie,
    expectStatus: 200,
  });
}

/**
 * check5: GET /api/web/associations (비인증 공개 API).
 * 협회 목록은 public API이므로 쿠키 없이 200 기대.
 * fetchCheck의 "cookie===null일 때 cookie_unavailable 실패 처리" 규칙과 충돌하므로
 * 공개 API 전용으로 독립 구현 (쿠키 없이도 200이어야 정상).
 */
async function check5Associations(baseUrl: string): Promise<CheckResult> {
  const start = Date.now();
  const url = `${baseUrl}/api/web/associations`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const passed = res.status === 200;
    return {
      category: "api",
      name: "associations_list",
      target_url: url,
      passed,
      status_code: res.status,
      duration_ms: Date.now() - start,
      error_message: passed ? undefined : `expected=200 actual=${res.status}`,
    };
  } catch (err) {
    return {
      category: "api",
      name: "associations_list",
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

/**
 * check6: GET /api/web/referee-applications/announcements (봇 Referee 쿠키).
 * 심판이 자신에게 보이는 공고 목록을 정상 조회할 수 있는지 확인.
 */
async function check6Announcements(baseUrl: string, cookie: string | null): Promise<CheckResult> {
  return fetchCheck({
    category: "api",
    name: "referee_announcements",
    url: `${baseUrl}/api/web/referee-applications/announcements`,
    cookie,
    expectStatus: 200,
  });
}

/**
 * check7: 비인증 접근 차단 확인.
 * 쿠키 없이 admin 전용 API 호출 → 401(UNAUTHORIZED) 기대.
 * withWebAuth가 정상 동작하는지 security 회귀 점검.
 */
async function check7UnauthBlocked(baseUrl: string): Promise<CheckResult> {
  const start = Date.now();
  const url = `${baseUrl}/api/web/referee-admin/members`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const passed = res.status === 401;
    return {
      category: "security",
      name: "unauth_blocked",
      target_url: url,
      passed,
      status_code: res.status,
      duration_ms: Date.now() - start,
      error_message: passed ? undefined : `expected=401 actual=${res.status}`,
    };
  } catch (err) {
    return {
      category: "security",
      name: "unauth_blocked",
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

/**
 * check8: IDOR 차단 확인.
 * 봇 Referee 계정(관리자 아님)으로 admin API 호출 → 403(FORBIDDEN) 기대.
 * admin-guard가 정상 동작하는지 확인.
 */
async function check8IdorBlocked(baseUrl: string, cookie: string | null): Promise<CheckResult> {
  const start = Date.now();
  const url = `${baseUrl}/api/web/referee-admin/members`;
  if (!cookie) {
    return {
      category: "security",
      name: "idor_blocked",
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: "cookie_unavailable (check3 실패 여파)",
    };
  }
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", Cookie: cookie },
      cache: "no-store",
    });
    // 403 또는 401 중 하나로 차단되면 security 관점에서 passed
    // (admin_role 없으면 401로 떨어질 수도 있고, 있지만 권한 부족이면 403)
    const passed = res.status === 403 || res.status === 401;
    return {
      category: "security",
      name: "idor_blocked",
      target_url: url,
      passed,
      status_code: res.status,
      duration_ms: Date.now() - start,
      error_message: passed ? undefined : `expected=403/401 actual=${res.status}`,
    };
  } catch (err) {
    return {
      category: "security",
      name: "idor_blocked",
      target_url: url,
      passed: false,
      duration_ms: Date.now() - start,
      error_message: sliceError(err),
    };
  }
}

// --- 메인 핸들러 ---

export async function GET(req: NextRequest) {
  // 1) CRON_SECRET 검증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const overallStart = Date.now();
  const baseUrl = resolveBaseUrl(req);

  // 2) Run 레코드 생성 (running 상태) — 실패해도 cron은 계속 시도해야 하지만
  //    DB 장애면 check1에서 어차피 실패할 것. 여기서 실패는 500 반환.
  let run: { id: bigint };
  try {
    run = await prisma.healthCheckRun.create({
      data: {
        run_type: "hourly",
        triggered_by: "cron",
        status: "running",
      },
      select: { id: true },
    });
  } catch (err) {
    console.error("[cron/referee-healthcheck] Run 생성 실패:", err);
    return apiError("Run 생성 실패", 500, "INTERNAL_ERROR");
  }

  const results: CheckResult[] = [];

  try {
    // 3) check1/2 병렬 (쿠키 불필요)
    // 4) check3 — 봇 로그인 (Admin + Referee 병렬 내부 처리)
    //    check3이 끝나야 쿠키를 check4/6/8에 전달 가능하므로 먼저 실행
    const [r1, r2, login] = await Promise.all([
      withTimeout(check1DbPing(), 5000, "db_ping").catch((err): CheckResult => ({
        category: "db",
        name: "db_ping",
        passed: false,
        duration_ms: 5000,
        error_message: sliceError(err),
      })),
      withTimeout(check2RedisPing(), 5000, "redis_ping").catch((err): CheckResult => ({
        category: "cache",
        name: "redis_ping",
        passed: false,
        duration_ms: 5000,
        error_message: sliceError(err),
      })),
      withTimeout(check3BotLogin(), 5000, "bot_login").catch((err) => ({
        result: {
          category: "auth" as const,
          name: "bot_login",
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        },
        adminCookie: null as string | null,
        refereeCookie: null as string | null,
      })),
    ]);
    results.push(r1, r2, login.result);

    // 5) check4/5/6/7/8 병렬 (쿠키 필요한 것은 login.refereeCookie 사용)
    const [r4, r5, r6, r7, r8] = await Promise.all([
      withTimeout(check4RefereeMe(baseUrl, login.refereeCookie), 5000, "referees_me").catch(
        (err): CheckResult => ({
          category: "api",
          name: "referees_me",
          target_url: `${baseUrl}/api/web/referees/me`,
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        })
      ),
      withTimeout(check5Associations(baseUrl), 5000, "associations_list").catch(
        (err): CheckResult => ({
          category: "api",
          name: "associations_list",
          target_url: `${baseUrl}/api/web/associations`,
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        })
      ),
      withTimeout(check6Announcements(baseUrl, login.refereeCookie), 5000, "announcements").catch(
        (err): CheckResult => ({
          category: "api",
          name: "referee_announcements",
          target_url: `${baseUrl}/api/web/referee-applications/announcements`,
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        })
      ),
      withTimeout(check7UnauthBlocked(baseUrl), 5000, "unauth_blocked").catch(
        (err): CheckResult => ({
          category: "security",
          name: "unauth_blocked",
          target_url: `${baseUrl}/api/web/referee-admin/members`,
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        })
      ),
      withTimeout(check8IdorBlocked(baseUrl, login.refereeCookie), 5000, "idor_blocked").catch(
        (err): CheckResult => ({
          category: "security",
          name: "idor_blocked",
          target_url: `${baseUrl}/api/web/referee-admin/members`,
          passed: false,
          duration_ms: 5000,
          error_message: sliceError(err),
        })
      ),
    ]);
    results.push(r4, r5, r6, r7, r8);

    // 6) 결과 집계
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    let finalStatus: "passed" | "partial" | "failed";
    if (failed === 0) finalStatus = "passed";
    else if (passed === 0) finalStatus = "failed";
    else finalStatus = "partial";

    const duration = Date.now() - overallStart;

    // 7) 결과 저장 + Run 업데이트 (createMany + update를 트랜잭션 없이 순차)
    //    실패해도 다음 cron이 새 run을 만들므로 트랜잭션 불필요 (append-only)
    await prisma.healthCheckResult.createMany({
      data: results.map((r) => ({
        run_id: run.id,
        category: r.category,
        name: r.name,
        target_url: r.target_url ?? null,
        passed: r.passed,
        status_code: r.status_code ?? null,
        duration_ms: r.duration_ms,
        error_message: r.error_message ? r.error_message.slice(0, 1000) : null,
      })),
    });

    await prisma.healthCheckRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        total_checks: total,
        passed_checks: passed,
        failed_checks: failed,
        duration_ms: duration,
        finished_at: new Date(),
      },
    });

    // 8) 응답 — BigInt는 문자열로 변환 (JSON 직렬화 불가)
    return apiSuccess({
      run_id: run.id.toString(),
      status: finalStatus,
      total,
      passed,
      failed,
      duration_ms: duration,
    });
  } catch (err) {
    // 예상 외 예외 — run을 failed로 마감 시도 (실패해도 무시)
    console.error("[cron/referee-healthcheck] 치명적 예외:", err);
    try {
      await prisma.healthCheckRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          total_checks: results.length,
          passed_checks: results.filter((r) => r.passed).length,
          failed_checks: results.filter((r) => !r.passed).length,
          duration_ms: Date.now() - overallStart,
          finished_at: new Date(),
        },
      });
    } catch {
      // run 업데이트 실패도 무시 — 다음 cron에서 복구
    }
    return apiError("헬스체크 실행 실패", 500, "INTERNAL_ERROR");
  }
}
