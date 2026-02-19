# MyBDR - Basketball Tournament Platform

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
