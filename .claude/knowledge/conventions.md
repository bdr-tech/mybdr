# 코딩 규칙 및 스타일
<!-- 담당: developer, reviewer | 최대 30항목 -->

### [2026-03-22] 디자인 시스템 색상 체계
- **분류**: convention
- **발견자**: planner-architect
- **내용**: Primary #E31B23, Navy #1B3C87, Info #0079B9. 다크모드 기본. 모든 neutral은 쿨 그레이(R=G=B). 핑크/살몬/코랄 절대 금지.
- **참조횟수**: 5

### [2026-03-22] 아이콘 라이브러리
- **분류**: convention
- **발견자**: developer
- **내용**: Material Symbols Outlined 사용. lucide-react 완전 제거됨. 활성 아이콘 FILL 1.
- **참조횟수**: 3

### [2026-03-22] 폰트 체계
- **분류**: convention
- **발견자**: developer
- **내용**: 한글 본문 Pretendard, 영문 제목 Space Grotesk. CDN 로드.
- **참조횟수**: 2

### [2026-03-22] 버튼/컴포넌트 스타일
- **분류**: convention
- **발견자**: developer
- **내용**: 버튼 border-radius 4px (pill 9999px 금지). 카드 bg-card border-border rounded-lg. 호버 active:scale-95.
- **참조횟수**: 2

### [2026-03-22] 레이아웃 브레이크포인트
- **분류**: convention
- **발견자**: developer
- **내용**: lg(1024px) 기준. 데스크탑 사이드바 w-64 + sidebar-scaled(0.96). 모바일 헤더 h-16 + 하단네비 h-16.
- **참조횟수**: 2

### [2026-03-23] 페이지 리디자인 공통 패턴
- **분류**: convention
- **발견자**: pm
- **내용**: 모든 리디자인 시 "API 유지, UI만 변경" 원칙. 2열 레이아웃(lg:grid-cols-12, 좌 col-span-8 + 우 col-span-4). 섹션 헤더에 빨간/파란 세로 막대(w-1.5 h-6). 모바일은 1열(사이드바 하단). 히어로 배너에 그라디언트 배경. 클라이언트 사이드 페이지네이션(서버 API 변경 회피).
- **참조횟수**: 6

### [2026-03-23] DB 미지원 기능 처리 규칙
- **분류**: convention
- **발견자**: pm
- **내용**: DB에 없는 기능(좋아요/팔로우/티어 등)은 UI만 배치하고 동작 미구현. placeholder("-", "0") 사용. DB 스키마 변경은 별도 작업으로 분리. 이미지 없으면 CSS 그라디언트 또는 이니셜로 대체.
- **참조횟수**: 5

### [2026-03-28] BDR 디비전 체계 (3단계 계층)
- **분류**: convention
- **발견자**: developer
- **내용**: 1단계 성별(남성부/여성부) → 2단계 종별(일반부/유청소년/대학부/시니어) → 3단계 디비전(D3~D8/하모니~i4/U1~U3/S1~S3). 여성부는 코드 뒤에 W 추가. 공통 상수: src/lib/constants/divisions.ts. 자연어→표준코드 매핑은 scripts/migrate-divisions.ts 참조.
- **참조횟수**: 0

### [2026-03-23] 가로 스크롤 + 그리드 반응형 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 모바일에서 가로 스크롤(flex overflow-x-auto no-scrollbar), 데스크탑에서 N열 그리드(md:grid md:grid-cols-N md:overflow-visible). 카드 min-w-[Npx] md:min-w-0으로 스크롤/그리드 전환.
- **참조횟수**: 4

### [2026-03-28] 대회 상태 4종 통일 규칙
- **분류**: convention
- **발견자**: pm (사용자 지시)
- **내용**: 프로젝트 전체에서 대회 상태를 4종으로만 표시: **준비중**(draft/upcoming), **접수중**(registration/active/open 등), **진행중**(in_progress/live/ongoing 등), **종료**(completed/ended/cancelled 등). 공통 상수: src/lib/constants/tournament-status.ts
- **참조횟수**: 0

### [2026-03-28] admin UI 공통 패턴 (서버page + 클라이언트content)
- **분류**: convention
- **발견자**: developer
- **내용**: admin 페이지는 page.tsx(서버 컴포넌트, Prisma 쿼리+직렬화) + admin-{name}-content.tsx(클라이언트, AdminStatusTabs+테이블+AdminDetailModal) 패턴으로 통일. 테이블 3~4칸, 행 클릭 시 중앙 플로팅 모달, 상태별 탭 필터링. 공통 컴포넌트: AdminPageHeader, AdminDetailModal, AdminStatusTabs.
- **참조횟수**: 0

### [2026-03-28] 카드 컴팩트화 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 경기/대회/팀 카드 공통 구조 — 이미지 영역(h-20 lg:h-28, 유형별 그라디언트/Places 사진) + 정보 영역(p-3, 2줄: 제목+현황 / 금액+버튼). 이미지 좌상단 유형뱃지, 우하단 장소+시간 뱃지(bg-black/50 backdrop-blur). 텍스트 최소 text-xs(12px).
- **참조횟수**: 0
