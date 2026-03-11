# MyBDR - Basketball Tournament Platform

## 개발팀 스킬 (`/team:*`)

역할별 전문가를 슬래시 커맨드로 호출. `/team:dev`, `/team:architect` 등.
작업 전 Dev/plan.md 승인 주석을 항상 확인할 것.

## 이 프로젝트의 4단계 방어체계를 지키자. 
1. 리서치(research.md)가 무지한 변경을 막아주고
2. 계획(plan.md) 가 잘못된 변경을 막아주고
3. 주석(plan.md의 내용을 사용자가 수정)으로 내 판단을 주입하고 
4. 구현 명령이 방해 없이 실행됨. 



## 리서치 / 기획 파일 위치 정보 
1. Research.md (/Users/grizrider/CC/mybdr/Dev/research.md)
2. plan.md (/Users/grizrider/CC/mybdr/Dev/plan.md)


이 두 파일을 기준으로 프로젝트를 

## 프로젝트 개요
Rails 8.0 기반 BDR Platform을 Next.js 15로 전환한 프로젝트.
보안 최우선, Flutter 앱(bdr_stat) API 100% 호환.

## 기술 스택
- **Framework**: Next.js 15 (App Router, TypeScript strict)
- **ORM**: Prisma 6 + PostgreSQL (기존 Rails DB 유지)
- **Auth**: JWT (API, Rails 호환) + NextAuth v5 (웹)
- **Validation**: Zod
- **CSS**: Tailwind CSS 4 (다크 테마 + 웜 오렌지 #F4A261)
- **배포**: Vercel (Docker 없음)

## 디렉토리 구조
```
src/app/(web)/       → 웹 페이지 (NextAuth 세션)
src/app/(site)/      → 토너먼트 사이트 (서브도메인)
src/app/api/v1/      → Flutter REST API (JWT)
src/lib/auth/        → 인증 (JWT, RBAC)
src/lib/security/    → 보안 (Rate Limit)
src/lib/api/         → API 미들웨어 체인
src/lib/validation/  → Zod 스키마
src/lib/db/          → Prisma 싱글톤
src/lib/utils/       → snake_case 변환 등
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

## 기획 산출물
`outputs/` 디렉토리에 Dylan→Sophia→Marcus→Aria 순서로 작성된 기획/분석/설계/디자인 문서 보관.
