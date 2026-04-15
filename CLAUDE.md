# MyBDR - Basketball Tournament Platform

## 🚦 브랜치 / 워크플로우 규칙 (최우선)

### 브랜치 구조
- `main` — 보호 브랜치, 운영. **직접 push 절대 금지**. `dev → main` 머지는 원영이 담당
- `dev` — 통합 브랜치. 팀원 브랜치 PR이 모이는 곳
- `subin` — 수빈 개인 작업 브랜치
- `wonyoung` — 원영 개인 작업 브랜치

### 하루 작업 루틴
```bash
# 1) dev 최신화
git checkout dev && git pull origin dev

# 2) 내 브랜치로 돌아와 dev 머지
git checkout subin
git merge dev

# 3) 작업 → 커밋 → 푸시
git add .
git commit -m "feat: 기능명"
git push origin subin

# 4) GitHub에서 subin → dev PR 생성
```

### 🚨 절대 금지
1. `main` 브랜치에 직접 push (운영 사이트 즉시 영향)
2. `.env`에 **운영 DB URL** 사용 (사용자 데이터 파괴 위험)
3. 운영 DB 대상 `prisma db push` / 마이그레이션 실행

### 개발 환경 구성
- **개발 DB**: Supabase 개발 전용 인스턴스 (운영과 분리)
- **개발 프리뷰**: https://mybdr-git-dev-mybdr.vercel.app/ (Vercel, `dev` 브랜치 연동)
- **로컬 포트**: `http://localhost:3001` (`package.json`의 `dev` 스크립트에 `--port 3001` 고정)
- **referee 브랜치 포트**: `subin-referee` 브랜치 작업 시 `--port 3002` 사용 (메인 개발서버 3001과 동시 실행 가능)
- **.env**: 개발 DB URL + localhost 주소. **운영 DB URL 사용 금지**
- **.env.local**: 로컬 port 3001용 auth/CORS/APP_URL 오버라이드 (gitignored)

### "오늘 작업 시작하자" 체크리스트
사용자가 **"오늘 작업 시작하자"** 또는 유사한 말(작업 시작 / 세팅 확인)을 하면, 본 작업 전에 아래를 점검하고 사용자 승인을 받은 뒤에만 진행한다.

1. `git remote -v` → `github.com/bdr-tech/mybdr.git` 가리키는지
2. `git fetch origin --prune` 후 `main` / `dev` / `subin`의 원격-로컬 차이
3. 현재 브랜치가 `subin`인지 (아니면 전환 제안)
4. `.env` 존재 여부 + `DATABASE_URL`이 개발 DB인지 (값 노출 금지, "개발 DB로 보입니다" 수준만 보고)
5. `.env.local`에 localhost:3001 오버라이드가 있는지
6. 결과를 요약 보고 후 "이대로 작업 시작해도 될까요?" 명시적 승인 요청

승인 전에는 임의로 파일 수정, 브랜치 전환, 머지, 커밋을 **하지 않는다**.

---

## 프로젝트 개요
Rails 8.0 기반 BDR Platform을 Next.js 15로 전환한 프로젝트.
보안 최우선, Flutter 앱(bdr_stat) API 100% 호환.

## 심판/경기원 플랫폼 아키텍처 (2026-04-13 확정)
- **구조**: 분리형 — 메인 사이트(web)와 심판 플랫폼(referee)은 독립된 UX/셸을 가짐
- **도메인**: 공유 — mybdr.co.kr/referee (Path 기반, 서브도메인 아님)
- **DB**: 공유 — 단일 PostgreSQL, User/Tournament/Game 등 기존 테이블 참조
- **인증**: 공유 — 같은 JWT + 웹세션 (같은 도메인이라 쿠키 자동 공유)
- **코드 분리**: Next.js App Router의 `(referee)` 라우트 그룹 + `referee-shell.tsx` 독립 셸
- **원칙**: 같은 건물(도메인) 안의 별도 사무실(라우트 그룹). 전기/수도(DB/인증)는 공유, 인테리어(UI)는 독립
- **포트**: `subin-referee` 브랜치 작업 시 `--port 3002` (메인 개발서버 3001과 동시 실행)

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
