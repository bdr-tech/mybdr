// ============================================================================
// 심판 플랫폼 Commit 1 — Association 20개 시드 (CommonJS)
//
// 이유: Prisma 6에서 TypeScript seed를 돌리려면 tsx/ts-node 같은 추가 devDep가
// 필요하지만, 이번 Commit 1 범위는 "추가 패키지 설치 0"이 원칙이다. 그래서
// Node가 바로 실행할 수 있는 CommonJS(.js)로 작성한다.
//
// 실행 방법: `npx prisma db seed`  (package.json의 "prisma.seed"가 이 파일 지정)
//
// idempotent 보장: code UNIQUE를 기준으로 upsert → 여러 번 실행해도 20행 유지.
// ============================================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 17개 시도협회 (ISO 3166-2:KR 번호를 KBA-XX 형식으로 차용)
// region_sido 값은 반드시 src/lib/constants/regions.ts의 REGIONS 키와 일치해야 함.
// (해당 키: 서울/부산/대구/인천/광주/대전/울산/세종/경기/강원/충북/충남/전북/전남/경북/경남/제주)
const SIDO_ASSOCIATIONS = [
  { code: "KBA-11", name: "서울특별시농구협회", region_sido: "서울" },
  { code: "KBA-26", name: "부산광역시농구협회", region_sido: "부산" },
  { code: "KBA-27", name: "대구광역시농구협회", region_sido: "대구" },
  { code: "KBA-28", name: "인천광역시농구협회", region_sido: "인천" },
  { code: "KBA-29", name: "광주광역시농구협회", region_sido: "광주" },
  { code: "KBA-30", name: "대전광역시농구협회", region_sido: "대전" },
  { code: "KBA-31", name: "울산광역시농구협회", region_sido: "울산" },
  { code: "KBA-36", name: "세종특별자치시농구협회", region_sido: "세종" },
  { code: "KBA-41", name: "경기도농구협회", region_sido: "경기" },
  { code: "KBA-42", name: "강원특별자치도농구협회", region_sido: "강원" },
  { code: "KBA-43", name: "충청북도농구협회", region_sido: "충북" },
  { code: "KBA-44", name: "충청남도농구협회", region_sido: "충남" },
  { code: "KBA-45", name: "전북특별자치도농구협회", region_sido: "전북" },
  { code: "KBA-46", name: "전라남도농구협회", region_sido: "전남" },
  { code: "KBA-47", name: "경상북도농구협회", region_sido: "경북" },
  { code: "KBA-48", name: "경상남도농구협회", region_sido: "경남" },
  { code: "KBA-50", name: "제주특별자치도농구협회", region_sido: "제주" },
];

async function main() {
  console.log("[seed] Association upsert 시작");

  // 1단계: 최상위 조직 KBA (parent_id = null). 반드시 먼저 만들어야
  // 시도협회들이 parent_id로 참조할 수 있다.
  const kba = await prisma.association.upsert({
    where: { code: "KBA" },
    create: {
      code: "KBA",
      name: "대한민국농구협회",
      level: "national",
      region_sido: null,
      parent_id: null,
    },
    update: {
      name: "대한민국농구협회",
      level: "national",
      region_sido: null,
      parent_id: null,
    },
  });
  console.log(`[seed] KBA upsert 완료 (id=${kba.id})`);

  // 2단계: 17개 시도협회 (parent_id = KBA.id). 순회 upsert.
  let sidoCount = 0;
  for (const sido of SIDO_ASSOCIATIONS) {
    await prisma.association.upsert({
      where: { code: sido.code },
      create: {
        code: sido.code,
        name: sido.name,
        level: "sido",
        region_sido: sido.region_sido,
        parent_id: kba.id,
      },
      update: {
        name: sido.name,
        level: "sido",
        region_sido: sido.region_sido,
        parent_id: kba.id,
      },
    });
    sidoCount++;
  }
  console.log(`[seed] 시도협회 ${sidoCount}개 upsert 완료`);

  // 3단계: 프로리그 KBL / WKBL (parent_id = null, KBA 산하 아님 — 독립 조직).
  await prisma.association.upsert({
    where: { code: "KBL" },
    create: {
      code: "KBL",
      name: "한국농구연맹",
      level: "pro_league",
      region_sido: null,
      parent_id: null,
    },
    update: {
      name: "한국농구연맹",
      level: "pro_league",
      region_sido: null,
      parent_id: null,
    },
  });
  await prisma.association.upsert({
    where: { code: "WKBL" },
    create: {
      code: "WKBL",
      name: "한국여자농구연맹",
      level: "pro_league",
      region_sido: null,
      parent_id: null,
    },
    update: {
      name: "한국여자농구연맹",
      level: "pro_league",
      region_sido: null,
      parent_id: null,
    },
  });
  console.log("[seed] KBL/WKBL upsert 완료");

  const total = await prisma.association.count();
  console.log(`[seed] 현재 Association 총 개수: ${total}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("[seed] 완료");
  })
  .catch(async (e) => {
    console.error("[seed] 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
