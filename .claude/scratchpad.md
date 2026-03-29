# 작업 스크래치패드

## 현재 작업
- **요청**: 페이지 로딩 속도 최적화 종합 조사
- **상태**: 조사 완료
- **현재 담당**: planner-architect

### 기획설계 (planner-architect) — 성능 최적화 종합 조사

---

#### 현재 상태 진단

**이미 잘하고 있는 것:**
- ISR 적용 (홈 60초, 코트 300초, 대회 30초 등)
- SWR 클라이언트 캐싱 (dedupingInterval 10초, revalidateOnFocus false)
- loading.tsx 14개 경로에 배치 (Streaming SSR)
- 이미지 AVIF/WebP 포맷 최적화
- Prisma 싱글톤 패턴 (개발환경 globalThis 캐싱)
- staleTimes 설정 (dynamic 30초, static 300초)
- Promise.allSettled로 병렬 프리페치 (홈페이지)
- Pretendard 비동기 로딩 (media="print" 트릭)
- Upstash Redis 이미 Rate Limiting에 사용 중

**병목 지점:**
- courts/page.tsx: 전체 코트 1,045개 한 번에 조회 (3개 쿼리 순차)
- Prisma select가 넓음 (20개+ 컬럼 선택)
- DB 인덱스 @@index가 0개 (Prisma 스키마에 없음)
- Pretendard 전체 CSS 로딩 (서브셋 아님, 약 6MB 다운로드)
- unstable_cache 사용이 series 1곳만
- Material Symbols 폰트 전체 로딩 (아이콘별 서브셋 아님)

---

#### 최적화 방법 종합 분석

**[1] DB 인덱스 추가 — 효과: 상 / 난이도: 하 / 비용: 무료**
비유: 책에 목차가 없으면 매번 처음부터 끝까지 넘겨야 하는 것
- Prisma 스키마에 @@index가 하나도 없음 (Rails에서 이전 시 누락 추정)
- court_infos: status, average_rating, city 인덱스 필요
- court_sessions: court_id + checked_in_at 복합 인덱스
- pickup_games: court_info_id + scheduled_date + status 복합 인덱스
- games: played_at, tournament_id 인덱스
- 효과: 1,045건 이상 테이블에서 쿼리 시간 50~80% 감소 가능
- 추천: 즉시 적용 (가장 가성비 높음)

**[2] courts/page.tsx 쿼리 최적화 — 효과: 상 / 난이도: 하 / 비용: 무료**
비유: 마트에서 3번 왕복하는 것을 1번에 끝내는 것
- 현재 3개 쿼리 순차 실행 (활성세션 groupBy + 픽업게임 groupBy + 코트 findMany)
- Promise.all로 3쿼리 병렬 실행 가능 (서로 의존 없음)
- 코트 select에서 description 등 목록에 불필요한 필드 제거
- 1,045개 전체 로딩 -> 페이지네이션 또는 지역별 lazy 로딩 고려
- 추천: 즉시 적용

**[3] Pretendard 서브셋 전환 — 효과: 중 / 난이도: 하 / 비용: 무료**
비유: 백과사전 전체 대신 필요한 장만 가져오는 것
- 현재: pretendard.css (전체 웨이트) -> 약 6MB 이상 다운로드
- 변경: pretendard-dynamic-subset.min.css 사용 (자동 서브셋, 필요한 글자만)
- cdn.jsdelivr.net 같은 CDN에서 dynamic subset 제공
- 또는 next/font/local로 self-hosting (WOFF2, 약 300KB로 축소)
- 추천: 즉시 적용 (CDN URL만 바꾸면 됨)

**[4] unstable_cache 확대 적용 — 효과: 상 / 난이도: 중 / 비용: 무료**
비유: 자주 묻는 질문을 미리 답변판에 적어두는 것
- 현재 series 1곳만 사용 중
- courts 목록, rankings, teams 목록 등 자주 바뀌지 않는 데이터에 적용
- ISR revalidate와 함께 사용하면 이중 캐시 (CDN + 서버 메모리)
- 주의: Next.js 16에서 use cache로 대체 예정 (현재 15이므로 unstable_cache OK)
- 추천: 중기 적용 (코드 변경 필요하지만 효과 큼)

**[5] Prisma Accelerate (엣지 캐싱) — 효과: 상 / 난이도: 중 / 비용: 무료~유료**
비유: 전국에 분산된 창고에 자주 찾는 물건을 미리 비치해두는 것
- 300+ 엣지 노드에서 쿼리 결과 캐싱 (5~20ms 응답)
- 무료: 월 60,000 쿼리 (소규모 트래픽에 충분)
- 설정: prisma generate --accelerate + DATABASE_URL 변경만으로 적용
- Supabase PgBouncer와 함께 사용 가능
- 추천: 중기 적용 (트래픽 증가 시 검토)

**[6] Vercel KV/Redis 캐싱 — 효과: 중 / 난이도: 중 / 비용: 무료~유료**
비유: 냉장고에 자주 쓰는 재료를 미리 꺼내두는 것
- 이미 Upstash Redis 사용 중 (@upstash/redis) -> Rate Limiting 외 캐싱 확장
- 코트 목록, 통계 등 자주 조회하는 데이터를 Redis에 60초 TTL 캐시
- Vercel KV는 2024.12에 Upstash로 이관됨 -> 현재 @upstash/redis 직접 사용 권장
- 무료: 30MB, 일 10,000 요청
- 추천: 중기 적용 (이미 인프라 있음)

**[7] Partial Prerendering (PPR) — 효과: 상 / 난이도: 상 / 비용: 무료**
비유: 식당에서 기본 반찬은 미리 세팅하고, 주문 메뉴만 나중에 나오는 것
- Next.js 15에서 experimental.ppr = true로 활성화
- 정적 셸(네비/레이아웃)은 즉시 CDN에서 전달, 동적 데이터는 스트리밍
- 단일 HTTP 요청으로 정적+동적 모두 전달 (추가 왕복 없음)
- Next.js 16에서 stable (cacheComponents로 대체)
- 추천: 장기 적용 (Next.js 16 업그레이드 시 함께 검토)

**[8] 번들 사이즈 분석 — 효과: 중 / 난이도: 하 / 비용: 무료**
비유: 여행 가방에 안 쓸 물건이 얼마나 있는지 점검하는 것
- @next/bundle-analyzer로 어떤 패키지가 큰지 확인
- xlsx (SheetJS) 패키지가 번들에 포함될 가능성 (약 1MB+)
- 동적 import (lazy loading) 추가 대상 식별
- 추천: 즉시 적용 (분석만이라도)

**[9] Material Symbols 아이콘 최적화 — 효과: 중 / 난이도: 중 / 비용: 무료**
비유: 아이콘 도감 전체 대신, 쓰는 아이콘만 모아둔 주머니
- 현재: Google Fonts에서 전체 아이콘 폰트 로딩
- 대안 1: 사용하는 아이콘만 icon_list 파라미터로 서브셋
- 대안 2: SVG 스프라이트로 전환 (아이콘 50개 미만이면 더 가벼움)
- 추천: 중기 적용

**[10] Supabase 리전 확인 — 효과: 상 / 난이도: 하 / 비용: 무료**
비유: 한국에서 미국 창고에 물건 주문하면 느리듯, DB도 가까워야 빠름
- lessons.md에 "DB 리전이 성능 병목 -- 한국으로 이전" 기록 있음
- Supabase ap-northeast-2 (서울) 확인 필요
- Vercel 배포 리전도 icn1 (서울) 확인 필요
- 같은 리전이면 DB 왕복 1~5ms, 다른 리전이면 100~300ms
- 추천: 즉시 확인

---

#### TOP 5 추천 (즉시 적용 가능 순)

| 순위 | 방법 | 예상 효과 | 작업 시간 |
|------|------|----------|----------|
| 1 | DB 인덱스 추가 | 쿼리 50~80% 빨라짐 | 15분 |
| 2 | courts 쿼리 병렬화 + select 축소 | 코트 목록 2~3배 빨라짐 | 10분 |
| 3 | Pretendard dynamic subset 전환 | 폰트 로딩 90% 축소 (6MB->300KB) | 5분 |
| 4 | unstable_cache 확대 (코트/랭킹/팀 목록) | 반복 조회 90% 빨라짐 | 30분 |
| 5 | 번들 분석 + xlsx 동적 import | 초기 JS 번들 축소 | 20분 |

---

#### 장기 로드맵 (트래픽 증가 시)

| 단계 | 방법 | 시기 |
|------|------|------|
| 1단계 | Prisma Accelerate 무료 티어 적용 | 월 방문 1만+ |
| 2단계 | Upstash Redis 캐시 레이어 확장 | 월 방문 5만+ |
| 3단계 | Next.js 16 + PPR(cacheComponents) 전환 | 프레임워크 안정화 후 |
| 4단계 | Supabase Read Replicas | 월 방문 10만+ |

---

#### 적용하지 않는 것들 (이유)

| 방법 | 불채택 사유 |
|------|-----------|
| PostgREST 직접 호출 (Prisma 대체) | 타입 안전성 포기, 마이그레이션 비용 > 이득 |
| Supabase Edge Functions | 이미 Next.js API Routes로 충분, 이중 인프라 |
| Supabase Realtime (SWR 대체) | SWR 이미 잘 작동, 실시간 필요 없는 데이터가 대부분 |
| 코트 목록 정적 생성 (SSG) | 1,045개 활성세션/픽업 실시간 반영 필요, ISR이 적합 |

---

#### 실행 계획 (developer 배정)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | Supabase/Vercel 리전 확인 | PM (대시보드 확인) | 없음 |
| 2 | Prisma 스키마에 @@index 추가 + db push | developer | 없음 |
| 3 | courts/page.tsx 쿼리 병렬화 + select 축소 | developer | 없음 |
| 4 | Pretendard dynamic subset CSS URL 교체 | developer | 없음 |
| 5 | @next/bundle-analyzer 설치 + 분석 | developer | 없음 |
| 6 | unstable_cache 주요 페이지 적용 | developer | 2, 3 완료 후 |
| 7 | Material Symbols 서브셋 적용 | developer | 5 (아이콘 목록 파악 후) |

2~4단계는 서로 독립적이므로 **병렬 실행 가능**.

#### developer 주의사항
- DB 인덱스 추가는 prisma db push로 적용 (migration 아닌 직접 반영)
- unstable_cache 키 네이밍: ["courts-list"], ["rankings"] 등 의미 있는 키 사용
- Pretendard URL 변경 시 noscript 폴백도 함께 수정
- bundle-analyzer는 devDependencies에만 설치

## 전체 프로젝트 진행 현황

### 코트 로드맵
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 완료 |
| 데이터 정리 | cleanup + 카카오 재검증 | 완료 (1,045개) |
| 데이터 정리 | 유저 위키 시스템 | tester 통과 |
| Phase 5 | 픽업게임 모집 | tester 통과 |
| 장기 | 코트 앰배서더 | 구현 완료 |
| 장기 | 주간 운동 리포트 | 구현 완료 (tsc 통과) |
| 장기 | GPS 히트맵 | 구현 완료 (tsc 통과) |
| 장기 | 3x3 이벤트 | 구현 완료 (tsc 통과) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-30 | developer | 성능 최적화 3건: DB인덱스7개+쿼리병렬화+폰트서브셋 (3파일 수정) | tsc 통과 (기존 에러만) |
| 03-30 | developer | 3x3 이벤트: Prisma 4모델+API 4라우트+UI컴포넌트 (7파일, 신규5+수정2) | tsc 통과 |
| 03-29 | developer | 주간 운동 리포트: API+Cron+UI+진입점 (6파일, 신규3+수정3) | tsc 통과 |
| 03-29 | developer | GPS 히트맵: API+Canvas오버레이+토글UI (4파일) | tsc 통과 |
| 03-29 | developer | 코트 앰배서더: 신청/조회/승인/직접수정 (10파일) | tsc 통과 |
| 03-29 | developer | 카카오 전국 농구장 수집+등록: 1,045개 | 완료 |
| 03-29 | planner-architect | 장기 로드맵 4건 기획설계 | 완료 |
| 03-29 | tester | Phase 5 픽업게임 코드 검증: 45항목 전통과 | 전통과 |
| 03-29 | developer | Phase 5 픽업게임 6단계 (9파일) | tsc 통과 |
| 03-29 | developer | 유저 위키 시스템 7단계 (9파일) | tsc 통과 |
| 03-29 | developer+tester+reviewer | 코트 데이터 대청소 (14항목 전통과) | 완료 |
