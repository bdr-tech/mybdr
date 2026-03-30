# MyBDR - Basketball Tournament Platform

## 프로젝트 개요
Rails 8.0 기반 BDR Platform을 Next.js 15로 전환한 프로젝트.
보안 최우선, Flutter 앱(bdr_stat) API 100% 호환.

## 기술 스택
- **Framework**: Next.js 15 (App Router, TypeScript strict)
- **ORM**: Prisma 6 + PostgreSQL (기존 Rails DB 유지)
- **Auth**: JWT (API, Rails 호환) + 커스텀 웹 세션 (getWebSession)
- **Validation**: Zod
- **CSS**: Tailwind CSS 4 (BDR Red #E31B23 + 쿨 그레이)
- **폰트**: Pretendard (한글 본문) + Space Grotesk (영문 제목)
- **아이콘**: Material Symbols Outlined (lucide-react 제거됨)
- **배포**: Vercel (Docker 없음)

## 디자인 시스템 (2026-03-22 적용)
- **상세 문서**: Dev/design/DESIGN.md
- **색상**: Primary #E31B23, Navy #1B3C87, Info #0079B9
- **다크모드 기본**: 쿨 그레이 (R=G=B), 핑크/살몬/코랄 절대 금지
- **라이트모드**: html.light 클래스로 CSS 변수 자동 전환
- **버튼**: border-radius 4px (pill 9999px 금지)
- **하드코딩 색상 금지**: 반드시 var(--color-*) CSS 변수 사용

## 디렉토리 구조
```
src/app/(web)/       → 웹 페이지 (커스텀 JWT 세션)
src/app/(site)/      → 토너먼트 사이트 (서브도메인)
src/app/api/v1/      → Flutter REST API (JWT)
src/app/api/web/     → 웹 전용 API
src/lib/auth/        → 인증 (JWT, RBAC)
src/lib/security/    → 보안 (Rate Limit)
src/lib/api/         → API 미들웨어 체인
src/lib/validation/  → Zod 스키마
src/lib/db/          → Prisma 싱글톤
src/lib/utils/       → snake_case 변환 등
Dev/design/          → 디자인 시안 (Stitch 내보내기)
.claude/knowledge/   → 프로젝트 지식 베이스 (6파일)
.claude/scratchpad.md → 작업 현황 + 진행 보고서
```

## 보안 규칙
- 환경변수: 시크릿은 절대 `NEXT_PUBLIC_` 접두사 금지
- API: 모든 비공개 엔드포인트에 `withAuth` + `withValidation` 필수
- 응답: `apiSuccess()` / `apiError()` 헬퍼만 사용 (snake_case 자동 변환)
- IDOR: 리소스 접근 시 반드시 소유자/권한 검증
- 멀티테넌트: 서브도메인 쿼리에 tournamentId 조건 필수

## 코딩 컨벤션
- DB 컬럼: snake_case (@map으로 매핑)
- TypeScript 코드: camelCase
- API 응답: snake_case (자동 변환)
- 파일명: kebab-case (Next.js 규약)
- 하드코딩 색상 금지 → CSS 변수(var(--color-*)) 사용
- 아이콘: Material Symbols `<span>` 태그 (lucide-react 금지)
- 리디자인 원칙: API 유지 + UI만 변경 + 2열 레이아웃 + 클라이언트 페이지네이션

## 리디자인 작업 규칙
- 디자인 시안: Dev/design/{N}. {페이지명}/ 폴더에 code.html + screen.png
- **API/데이터 패칭 절대 변경 금지** — UI 렌더링만 교체
- DB에 없는 기능(좋아요/팔로우/티어)은 UI만 배치, 동작 미구현
- 이미지 없으면 CSS 그라디언트 또는 이니셜로 대체

---

## ⚡ 에이전트 실행 + 기록 관리 규칙

### 실행 효율화
1. **병렬 실행**: 독립 에이전트 동시 실행 (tester+reviewer 등)
2. **확인 축소**: 명확한 요청은 바로 실행, 모호한 것만 확인

### Git 커밋/푸시 규칙
- **자동 커밋**: tester 검증 통과 시 PM이 **자동으로 커밋** (사용자에게 매번 안 물어봄)
- **tester 생략 시**: 소규모 수정은 tsc --noEmit 통과만으로 커밋 가능
- **커밋 메시지**: Conventional Commits 형식 (feat:/fix:/style:/refactor:/docs:)
- **푸시는 자동으로 하지 않는다**: 사용자가 "푸시해" 또는 "push" 요청 시에만 진행
- **미푸시 알림**: 작업 완료 보고 시 미푸시 커밋 수를 항상 알림
- **Co-Authored-By**: 모든 커밋에 `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` 포함

### 에이전트별 기록 책임 (필수)

| 에이전트 | 기록 의무 |
|---------|----------|
| **planner-architect** | scratchpad "기획설계" 섹션 + architecture.md + decisions.md |
| **developer** | scratchpad "구현 기록" 섹션 (변경 파일 목록 + 주요 변경사항) |
| **tester** | scratchpad "테스트 결과" 섹션 (통과/실패 항목 + 수정 요청) |
| **debugger** | errors.md에 에러 패턴 기록 |
| **pm** | 작업 로그 + index.md 갱신 + 진행 현황 갱신 + lessons.md + conventions.md 승격 판단 |

### PM 작업 완료 체크리스트 (매 작업 후 필수)
```
□ scratchpad 작업 로그 1줄 추가 (10건 이내)
□ scratchpad 100줄 이내 유지 (초과 시 완료된 기획설계 섹션 삭제)
□ 에러 발생 → errors.md 즉시 기록
□ 30분+ 삽질 → lessons.md 기록
□ 기술 결정 → decisions.md 기록 (architect가 안 했으면 PM이)
□ 새 패턴 발견 → conventions.md 기록
□ 구조 변경 → architecture.md 기록 (architect가 안 했으면 PM이)
□ index.md 항목수 + 날짜 갱신
□ 진행 현황표(완료/미완료) 업데이트
□ 미푸시 커밋 있으면 사용자에게 알림
```

### 기록 구조
```
.claude/
├── scratchpad.md         ← 현재 작업 + 진행 현황 + 작업 로그 (100줄 이내)
└── knowledge/
    ├── index.md          ← 목차 + 항목수 + 최근 지식 (PM 관리)
    ├── architecture.md   ← 프로젝트 구조 (architect 기록, PM 검증)
    ├── conventions.md    ← 코딩/디자인 규칙 (developer 기록, PM 승격)
    ├── decisions.md      ← 기술 결정 이력 (architect 기록, PM 보충)
    ├── errors.md         ← 에러/함정 모음 (debugger/tester 기록)
    └── lessons.md        ← 배운 교훈 (PM 기록)
```

### scratchpad 구조 규칙
1. **현재 작업** (항상 최상단) — 요청/상태/담당
2. **진행 현황표** (프로젝트 전체) — 완료/미완료 페이지 대시보드
3. **작업 로그** (최근 10건) — 날짜/담당/작업/결과
4. **기획설계 섹션** (임시) — 작업 완료 시 삭제하고 로그에 요약
5. **구현/테스트 섹션** (임시) — 작업 완료 시 삭제

### knowledge 갱신 타이밍
- **architecture.md**: planner-architect가 새 페이지 분석할 때
- **conventions.md**: 새 패턴 3회 이상 반복 시 PM이 추가
- **decisions.md**: 기술 선택 시 architect가 기록, PM이 누락분 보충
- **errors.md**: 에러 해결 시 debugger/tester/PM이 즉시 기록
- **lessons.md**: 삽질 30분+ 또는 비효율 발견 시 PM이 기록
- **index.md**: 위 파일 변경될 때마다 PM이 갱신
