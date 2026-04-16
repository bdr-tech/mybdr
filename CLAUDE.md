# MyBDR - Basketball Tournament Platform

## 🚦 브랜치 / 워크플로우 (최우선)

### 브랜치
- `main` — 운영. **직접 push 금지**. `dev → main` 머지는 원영
- `dev` — 통합. 팀원 PR 모임
- `subin` — 수빈 개인
- `wonyoung` — 원영 개인

### 하루 작업 루틴
```bash
git checkout dev && git pull origin dev
git checkout subin && git merge dev
# 작업 → commit → push
git push origin subin
# GitHub에서 subin → dev PR
```

### 🚨 절대 금지
1. `main` 직접 push
2. `.env`에 운영 DB URL
3. 운영 DB 대상 `prisma db push`/마이그레이션

### 개발 환경
- **개발 DB**: Supabase 개발 전용 (운영 분리)
- **개발 프리뷰**: https://mybdr-git-dev-mybdr.vercel.app/
- **로컬 포트**: 3001 (package.json 고정). `subin-referee` 브랜치는 3002
- **.env**: 개발 DB + localhost. **운영 DB URL 금지**
- **.env.local**: 로컬 port 3001 auth/CORS 오버라이드 (gitignored)

### "오늘 작업 시작하자" 체크리스트
사용자가 **"오늘 작업 시작하자"** 류 말을 하면 본 작업 전 점검 + 승인 받기:
1. `git remote -v` (github.com/bdr-tech/mybdr)
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치가 subin인지
4. `.env` 존재 + DATABASE_URL이 개발 DB인지 (값 노출 금지)
5. `.env.local`에 localhost:3001 오버라이드 있는지
6. 결과 요약 → "이대로 작업 시작해도 될까요?" 승인

승인 전 파일 수정/브랜치 전환/머지/커밋 금지.

---

## 기술 스택
- **Framework**: Next.js 15 (App Router, TS strict)
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: JWT (Flutter) + 커스텀 웹세션 (getWebSession)
- **Validation**: Zod
- **CSS**: Tailwind CSS 4 (BDR Red #E31B23 + 쿨 그레이)
- **폰트**: Pretendard + Space Grotesk
- **아이콘**: Material Symbols Outlined (lucide-react 금지)
- **배포**: Vercel

## 디자인 핵심
- 상세: `Dev/design/DESIGN.md`
- 색상: Primary #E31B23, Navy #1B3C87, Info #0079B9
- 다크모드 기본 (쿨 그레이). 핑크/살몬/코랄 금지
- 버튼 border-radius 4px
- **하드코딩 색상 금지** → `var(--color-*)` 변수

## 디렉토리
```
src/app/(web)/       웹 페이지 (커스텀 세션)
src/app/(site)/      서브도메인 토너먼트 사이트
src/app/api/v1/      Flutter REST (JWT)
src/app/api/web/     웹 전용 API
src/lib/auth/ security/ api/ validation/ db/ utils/
src/lib/tournaments/official-match.ts  ← 공식 기록 가드 유틸
Dev/design/          디자인 시안
.claude/knowledge/   6파일 지식 베이스
.claude/scratchpad.md 작업 현황 (100줄 이내)
scripts/_templates/  재사용 가능한 일회성 스크립트 템플릿
```

## 보안
- 시크릿 `NEXT_PUBLIC_` 금지
- 비공개 API에 `withAuth` + `withValidation` 필수
- 응답은 `apiSuccess()` / `apiError()` (snake_case 변환)
- IDOR: 리소스 접근 시 소유자/권한 검증
- 멀티테넌트: 서브도메인 쿼리에 tournamentId 필수

## 코딩 컨벤션 (상세는 knowledge/conventions.md)
- DB: snake_case (@map) / TS: camelCase / 파일명: kebab-case
- 공식 기록 쿼리: `officialMatchWhere()` 유틸 필수 사용
- 리디자인: API/데이터 패칭 유지 + UI만 변경

---

## ⚡ 에이전트 실행 규칙
1. **병렬 실행** — 독립 에이전트 동시 (tester+reviewer 등)
2. **확인 축소** — 명확 요청은 바로 실행
3. **Agent 호출 기준** (conventions.md 참조):
   - PM 직접: 파일 1~2개, grep/read 1회, DB 조회 1회
   - Explore: 파일 3개+ 검색, 키워드 애매
   - planner: 구조적 결정, 영향 분석
   - developer: 2파일+ 연계 or 비즈니스 로직

## 📋 기록 (상세는 글로벌 CLAUDE.md)
- **scratchpad.md**: 현재 작업 + 작업 로그 10건 (100줄 이내)
- **knowledge/** 6파일: architecture / conventions / decisions / errors / lessons / index
- 에이전트별 기록 책임: planner → architecture+decisions / developer → 구현기록 / debugger → errors / pm → 작업 로그+index+lessons+승격

## PM 작업 완료 체크리스트
```
□ 작업 로그 1줄 (10건 이내)
□ scratchpad 100줄 이내
□ 에러 → errors.md
□ 30분+ 삽질 → lessons.md
□ 기술 결정 → decisions.md
□ 새 패턴 → conventions.md
□ 구조 변경 → architecture.md
□ index.md 갱신
□ 미푸시 커밋 알림
```
