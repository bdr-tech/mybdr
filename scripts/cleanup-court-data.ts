/**
 * cleanup-court-data.ts
 * ─────────────────────────────────────────────────────────
 * 코트 데이터 품질 대청소 스크립트
 *
 * 목적:
 * - data_source가 'manual_curation'이 아닌 코트(658개)의 추정 필드를 null로 초기화
 * - kakao_place_id 기준 중복 제거 (세션/리뷰 없는 것 삭제)
 * - 이름+주소 동일 중복 제거
 * - court_type 정리 (google_places 출처의 불확실한 분류 → 'unknown')
 * - verified 플래그 정리 (curated만 true, 나머지 false)
 *
 * 실행 방법:
 *   npx tsx scripts/cleanup-court-data.ts
 *
 * 주의: 실행 전 반드시 DB 백업. 되돌리기 어려운 작업임.
 * ─────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 코트 데이터 품질 대청소 시작 ===\n");

  // ─── 1단계: 추정 필드 null 초기화 ───
  // manual_curation이 아닌 코트들의 스크립트 기본값을 null로 리셋
  // 이유: fetch-real-courts.ts / discover-courts-kakao.ts가 넣은 기본값은
  //       실제 확인된 정보가 아니라 사용자를 오해시킴
  console.log("[1/5] 추정 필드 null 초기화...");

  const resetResult = await prisma.court_infos.updateMany({
    where: {
      // manual_curation이 아닌 모든 코트
      NOT: { data_source: "manual_curation" },
    },
    data: {
      surface_type: null,      // '아스팔트'/'마루' 일괄 설정값 제거
      hoops_count: null,       // 기본값 2 제거 (실제 확인 불가)
      hoop_height: null,       // 골대 높이 추정값 제거
      court_size: null,        // 코트 크기 미확인
      has_lighting: null,      // 조명 유무 미확인
      lighting_until: null,    // 조명 시간 미확인
      has_restroom: null,      // 화장실 유무 미확인
      has_parking: null,       // 주차장 유무 미확인
      is_free: null,           // 무료/유료 미확인
      rental_available: null,  // 대관 가능 여부 미확인
      nickname: null,          // 별칭 제거
      description: null,       // 설명 제거
      nearest_station: null,   // 가까운 역 제거
    },
  });

  console.log(`  → ${resetResult.count}개 코트의 추정 필드 초기화 완료\n`);

  // ─── 2단계: kakao_place_id 기준 중복 제거 ───
  // 같은 카카오 장소 ID를 가진 코트가 여러 개 있으면, 세션/리뷰가 있는 것만 남기고 삭제
  console.log("[2/5] kakao_place_id 중복 제거...");

  // kakao_place_id가 있는 코트들을 그룹화
  const kakaoGroups = await prisma.$queryRaw<
    { kakao_place_id: string; cnt: number }[]
  >`
    SELECT kakao_place_id, COUNT(*)::int as cnt
    FROM court_infos
    WHERE kakao_place_id IS NOT NULL AND status = 'active'
    GROUP BY kakao_place_id
    HAVING COUNT(*) > 1
  `;

  let kakaoDupsRemoved = 0;

  for (const group of kakaoGroups) {
    // 같은 kakao_place_id를 가진 코트들 조회
    const dupes = await prisma.court_infos.findMany({
      where: {
        kakao_place_id: group.kakao_place_id,
        status: "active",
      },
      include: {
        _count: {
          select: {
            court_sessions: true,
            court_reviews: true,
            court_checkins: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    // 사용 이력이 있는 코트를 우선 보존 (세션+리뷰+체크인 합산)
    const sorted = [...dupes].sort((a, b) => {
      const aUsage = a._count.court_sessions + a._count.court_reviews + a._count.court_checkins;
      const bUsage = b._count.court_sessions + b._count.court_reviews + b._count.court_checkins;
      // 사용 이력이 많은 것 우선, 같으면 curated 우선, 그것도 같으면 먼저 생성된 것
      if (aUsage !== bUsage) return bUsage - aUsage;
      if (a.data_source === "manual_curation") return -1;
      if (b.data_source === "manual_curation") return 1;
      return 0;
    });

    // 첫 번째(보존 대상)를 제외한 나머지를 soft delete
    const toDelete = sorted.slice(1);
    for (const dupe of toDelete) {
      await prisma.court_infos.update({
        where: { id: dupe.id },
        data: { status: "duplicate_removed" },
      });
      kakaoDupsRemoved++;
    }
  }

  console.log(`  → kakao_place_id 중복 ${kakaoDupsRemoved}개 비활성화\n`);

  // ─── 3단계: 이름+주소 동일 중복 제거 ───
  // kakao_place_id가 없어도, 이름과 주소가 완전히 같은 코트는 중복일 가능성 높음
  console.log("[3/5] 이름+주소 동일 중복 제거...");

  const nameAddrGroups = await prisma.$queryRaw<
    { name: string; address: string; cnt: number }[]
  >`
    SELECT name, address, COUNT(*)::int as cnt
    FROM court_infos
    WHERE status = 'active'
    GROUP BY name, address
    HAVING COUNT(*) > 1
  `;

  let nameAddrDupsRemoved = 0;

  for (const group of nameAddrGroups) {
    const dupes = await prisma.court_infos.findMany({
      where: {
        name: group.name,
        address: group.address,
        status: "active",
      },
      include: {
        _count: {
          select: {
            court_sessions: true,
            court_reviews: true,
            court_checkins: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    // 위와 동일한 우선순위로 보존 대상 선정
    const sorted = [...dupes].sort((a, b) => {
      const aUsage = a._count.court_sessions + a._count.court_reviews + a._count.court_checkins;
      const bUsage = b._count.court_sessions + b._count.court_reviews + b._count.court_checkins;
      if (aUsage !== bUsage) return bUsage - aUsage;
      if (a.data_source === "manual_curation") return -1;
      if (b.data_source === "manual_curation") return 1;
      return 0;
    });

    const toDelete = sorted.slice(1);
    for (const dupe of toDelete) {
      await prisma.court_infos.update({
        where: { id: dupe.id },
        data: { status: "duplicate_removed" },
      });
      nameAddrDupsRemoved++;
    }
  }

  console.log(`  → 이름+주소 중복 ${nameAddrDupsRemoved}개 비활성화\n`);

  // ─── 4단계: court_type 정리 ───
  // google_places 출처이면서 키워드 추정으로 분류된 것 중
  // 확실하지 않은 것은 'unknown'으로 변경
  console.log("[4/5] court_type 정리 (불확실한 분류 → unknown)...");

  // google_places 출처 중 키워드가 애매한 것 찾기
  // "농구교실", "리틀썬더스" 등 학원/클럽은 코트가 아닐 수 있음
  const ambiguousKeywords = ["교실", "클럽", "아카데미", "레슨", "학원"];
  let typeFixCount = 0;

  for (const keyword of ambiguousKeywords) {
    const result = await prisma.court_infos.updateMany({
      where: {
        data_source: "google_places",
        status: "active",
        name: { contains: keyword },
        court_type: { not: "unknown" },
      },
      data: { court_type: "unknown" },
    });
    typeFixCount += result.count;
  }

  console.log(`  → ${typeFixCount}개 코트의 court_type을 'unknown'으로 변경\n`);

  // ─── 5단계: verified 플래그 정리 ───
  // curated만 true, 나머지는 모두 false
  console.log("[5/5] verified 플래그 정리...");

  // 먼저 전체를 false로
  const resetVerified = await prisma.court_infos.updateMany({
    where: { verified: true, NOT: { data_source: "manual_curation" } },
    data: { verified: false },
  });

  // curated는 true 보장
  const setVerified = await prisma.court_infos.updateMany({
    where: { data_source: "manual_curation" },
    data: { verified: true },
  });

  console.log(`  → ${resetVerified.count}개 비큐레이션 코트 verified=false로 변경`);
  console.log(`  → ${setVerified.count}개 큐레이션 코트 verified=true 확인\n`);

  // ─── 결과 요약 ───
  const finalCount = await prisma.court_infos.count({ where: { status: "active" } });
  const curatedCount = await prisma.court_infos.count({
    where: { status: "active", data_source: "manual_curation" },
  });
  const unknownCount = await prisma.court_infos.count({
    where: { status: "active", court_type: "unknown" },
  });

  console.log("=== 정리 완료 ===");
  console.log(`  활성 코트: ${finalCount}개`);
  console.log(`  큐레이션: ${curatedCount}개`);
  console.log(`  미분류(unknown): ${unknownCount}개`);
  console.log(`  중복 제거: ${kakaoDupsRemoved + nameAddrDupsRemoved}개`);
}

main()
  .catch((e) => {
    console.error("오류 발생:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
