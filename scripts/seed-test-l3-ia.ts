/**
 * L3 IA(Information Architecture) 스모크 테스트용 시드 스크립트
 *
 * 목적:
 *   L3 기능(Organization 3단 계층, Series 브레드크럼, Tournament 소속 시리즈 카드,
 *   EditionSwitcher)을 개발 DB에서 실제로 스모크 테스트하기 위한 최소 데이터 구성.
 *
 *   - organizations: 기존 1건을 그대로 사용 (생성하지 않음)
 *   - tournament_series: "BDR 시리즈"(slug: bdr-series) 1건을 upsert
 *   - Tournament: name/organizer/host 중 하나라도 BDR 포함 대회를 전부 찾아
 *                 series_id 연결 + edition_number를 혼재 패턴으로 분배
 *                 (EditionSwitcher의 이전/다음/전체 + null 혼재 케이스 모두 검증)
 *
 * 재실행 안전성 (멱등):
 *   - slug(unique)로 findUnique → 없으면 create. 재실행 시 동일 시리즈 재사용
 *   - Tournament는 UPDATE only (DELETE 없음)
 *   - 이미 다른 시리즈(= BDR 아닌 series_id)가 연결된 대회는 경고 로그만 남기고 건드리지 않음
 *   - 같은 BDR 시리즈로 이미 연결된 대회는 edition_number만 재배포(순서는 created_at ASC 고정)
 *
 * edition_number 분배 규칙 (혼재 테스트 목적):
 *   - N >= 4: 1, 2, 3, null, 4, 5, 6, ...  (4번째 자리만 null)
 *   - N == 3: 1, 2, null
 *   - N == 2: 1, null
 *   - N == 1: null
 *   순서는 created_at ASC (먼저 생긴 대회가 1회차).
 *
 * 실행:
 *   npx tsx --env-file=.env.local scripts/seed-test-l3-ia.ts
 *
 * 주의:
 *   - 운영 DB에서 절대 실행 금지. .env.local 개발 DB 전제.
 *   - Prisma 스키마 변경 0 / DELETE 0 / 파괴적 UPDATE 0.
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// BDR 시리즈 식별 상수 (slug는 unique — 재실행 시 동일 시리즈 재사용)
const SERIES_SLUG = "bdr-series";
const SERIES_NAME = "BDR 시리즈";

async function main() {
  console.log("🏆 L3 IA 스모크 테스트 시드 시작...\n");

  // ─────────────────────────────────────────
  // 1. organizations 가장 오래된 1건 조회
  //    (생성하지 않고 기존 레코드 재사용)
  // ─────────────────────────────────────────
  const org = await prisma.organizations.findFirst({
    orderBy: { created_at: "asc" },
    select: { id: true, name: true, slug: true, owner_id: true },
  });

  if (!org) {
    // 시리즈는 organization_id FK가 필요하므로 org 없으면 중단
    console.error("❌ organizations 레코드가 0건입니다. 시드 전에 단체를 먼저 생성하세요.");
    process.exit(1);
  }

  console.log(`  ✅ 단체 재사용: ${org.name} (id: ${org.id}, slug: ${org.slug}, owner_id: ${org.owner_id})`);

  // ─────────────────────────────────────────
  // 2. BDR 매칭 Tournament 조회
  //    name / organizer / host 중 하나라도 "BDR" 포함 (대소문자 무관)
  //    created_at ASC로 정렬 → edition_number 순번 재현 가능
  // ─────────────────────────────────────────
  const bdrTournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { name: { contains: "BDR", mode: "insensitive" } },
        { organizer: { contains: "BDR", mode: "insensitive" } },
        { host: { contains: "BDR", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      series_id: true,
      edition_number: true,
      createdAt: true,
    },
  });

  console.log(`  🔍 BDR 매칭 대회: ${bdrTournaments.length}건`);

  if (bdrTournaments.length === 0) {
    console.warn("  ⚠️  BDR 매칭 대회 0건 — 시리즈만 생성하고 종료합니다.");
  }

  // ─────────────────────────────────────────
  // 3. tournament_series upsert (slug unique 활용)
  //    uuid는 최초 create 시에만 randomUUID() — findUnique로 중복 생성 방지
  // ─────────────────────────────────────────
  const now = new Date();

  let series = await prisma.tournament_series.findUnique({
    where: { slug: SERIES_SLUG },
    select: {
      id: true,
      uuid: true,
      name: true,
      slug: true,
      organization_id: true,
      organizer_id: true,
    },
  });

  if (!series) {
    // 최초 생성: uuid/created_at/updated_at 세팅
    series = await prisma.tournament_series.create({
      data: {
        uuid: randomUUID(),
        name: SERIES_NAME,
        slug: SERIES_SLUG,
        organization_id: org.id,
        organizer_id: org.owner_id,
        is_public: true,
        status: "active",
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        slug: true,
        organization_id: true,
        organizer_id: true,
      },
    });
    console.log(`  ✅ 시리즈 신규 생성: ${series.name} (id: ${series.id}, slug: ${series.slug})`);
  } else {
    console.log(`  ♻️  시리즈 재사용: ${series.name} (id: ${series.id}, slug: ${series.slug})`);
  }

  // ─────────────────────────────────────────
  // 4. 대회 series_id / edition_number 배포
  //    - 다른 시리즈에 속한 대회: skip (경고만)
  //    - 본 시리즈 소속 + 미연결 대회: UPDATE
  //    edition_number 분배 규칙 (혼재 테스트용):
  //    - N >= 4: 1, 2, 3, null, 4, 5, ...
  //    - N == 3: 1, 2, null
  //    - N == 2: 1, null
  //    - N == 1: null
  // ─────────────────────────────────────────
  const seriesId = series.id;

  // 다른 시리즈 소속인 대회는 건드리지 않고 경고만 (멱등/안전)
  const otherSeriesTournaments = bdrTournaments.filter(
    (t) => t.series_id !== null && t.series_id !== seriesId,
  );
  for (const t of otherSeriesTournaments) {
    console.warn(
      `  ⚠️  다른 시리즈에 속한 대회 skip — id=${t.id} name="${t.name}" series_id=${t.series_id}`,
    );
  }

  // 이번 작업 대상: 미연결 or 이미 본 BDR 시리즈 소속인 대회
  const targets = bdrTournaments.filter(
    (t) => t.series_id === null || t.series_id === seriesId,
  );
  const totalN = targets.length;

  // edition_number 배포 함수 — 위 규칙 그대로
  const buildEditionNumbers = (n: number): (number | null)[] => {
    if (n <= 0) return [];
    if (n === 1) return [null];
    if (n === 2) return [1, null];
    if (n === 3) return [1, 2, null];
    // N >= 4: [1, 2, 3, null, 4, 5, ..., N-1]
    const arr: (number | null)[] = [1, 2, 3, null];
    let next = 4;
    for (let i = 4; i < n; i++) {
      arr.push(next);
      next++;
    }
    return arr;
  };

  const editions = buildEditionNumbers(totalN);

  // 순차 UPDATE (건수 적음 — 배치 불필요)
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const newEdition = editions[i];
    await prisma.tournament.update({
      where: { id: t.id },
      data: {
        series_id: seriesId,
        edition_number: newEdition,
      },
    });
  }

  if (totalN > 0) {
    console.log(`  ✅ ${totalN}건 대회에 series_id=${seriesId} + edition 분배 완료`);
  }

  // ─────────────────────────────────────────
  // 5. 검증 출력 — 최종 상태를 DB에서 다시 읽어서 출력
  //    (스크립트 로직과 실제 DB 상태가 일치하는지 더블 체크)
  // ─────────────────────────────────────────
  // createdAt ASC로 정렬 — 분배 순서와 동일하게 출력해야 혼재 패턴(1,2,3,null,4,...)이 눈에 보임.
  // edition_number ASC로 정렬하면 Postgres가 null을 맨 뒤로 보내서 패턴이 가려진다.
  const finalList = await prisma.tournament.findMany({
    where: { series_id: seriesId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      edition_number: true,
      createdAt: true,
    },
  });

  console.log("\n" + "=".repeat(70));
  console.log("✅ BDR 시리즈 시드 완료");
  console.log("=".repeat(70));
  console.log(`  - Series id   : ${series.id}`);
  console.log(`  - Series slug : ${series.slug}`);
  console.log(`  - Series uuid : ${series.uuid}`);
  console.log(`  - Org id      : ${org.id} (${org.slug})`);
  console.log(`  - Organizer id: ${series.organizer_id}`);
  console.log(`  - 편입된 대회 수: ${finalList.length}`);
  console.log(
    `  - edition 분포 : [${finalList.map((t) => (t.edition_number ?? "null")).join(", ")}]`,
  );
  console.log(`\n  📋 시리즈 소속 대회 리스트:`);
  for (const t of finalList) {
    const ed = t.edition_number === null ? "null" : `#${t.edition_number}`;
    console.log(`    - id=${t.id} [${ed}] ${t.name}`);
  }
  console.log("=".repeat(70));
}

main()
  .catch((e) => {
    console.error("❌ 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
