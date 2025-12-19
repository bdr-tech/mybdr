# BDR Platform

농구 동호회 및 대회 관리를 위한 종합 플랫폼입니다.

## 기술 스택

- **Ruby**: 3.3+
- **Rails**: 8.0
- **Database**: PostgreSQL 14+
- **Background Jobs**: Solid Queue
- **Cache**: Solid Cache
- **CSS Framework**: Tailwind CSS
- **JavaScript**: Importmap + Stimulus

## 시스템 요구사항

- Ruby 3.3.0+
- PostgreSQL 14+
- Node.js 18+ (asset compilation)
- Redis (선택적, 개발 환경에서는 불필요)

## 설치 및 설정

### 1. 저장소 클론

```bash
git clone https://github.com/your-repo/bdr_platform.git
cd bdr_platform
```

### 2. 의존성 설치

```bash
bundle install
```

### 3. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 설정
```

### 4. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
bin/rails db:create

# 마이그레이션 실행
bin/rails db:migrate

# 시드 데이터 로드
bin/rails db:seed
```

### 5. 서버 실행

```bash
bin/rails server
# 또는 특정 포트 지정
PORT=3030 bin/rails server
```

## 테스트 계정

시드 데이터 로드 후 사용 가능한 테스트 계정:

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 슈퍼관리자 | admin@bdr.com | password123! | 전체 관리자 권한 |
| 대회관리자 | tournament@bdr.com | password123! | 대회 관리 권한 |
| 호스트 | host@bdr.com | password123! | 경기 주최 권한 |
| 일반유저 | user@bdr.com | password123! | 일반 사용자 |

## 주요 기능

### 경기 관리 (Games)
- 픽업 게임 생성 및 참가 신청
- 경기 템플릿 저장 및 재사용
- 참가비 결제 연동 (토스페이먼츠)

### 팀 관리 (Teams)
- 팀 생성 및 멤버 관리
- 팀 가입 신청/승인 시스템
- 팀 코드를 통한 초대

### 대회 관리 (Tournaments)
- 토너먼트 대회 생성 (싱글 엘리미네이션, 라운드 로빈 등)
- 대진표 자동 생성
- 실시간 스코어 기록
- 선수 통계 관리

### 대회 사이트 (Tournament Sites)
- 대회별 전용 웹사이트 생성
- 서브도메인 지원
- 다양한 템플릿 제공
- 페이지/섹션 드래그앤드롭 편집

### 커뮤니티 (Community)
- 게시판 (자유/정보/후기)
- 농구장 정보 및 리뷰
- 중고 장터

### 관리자 시스템 (Admin)
- 사용자 관리
- 대회 관리
- 결제 관리
- 시스템 설정
- 관리자 활동 로그

## 프로젝트 구조

```
bdr_platform/
├── app/
│   ├── controllers/
│   │   ├── admin/           # 슈퍼관리자 컨트롤러
│   │   ├── tournament_admin/ # 대회관리자 컨트롤러
│   │   └── ...
│   ├── models/
│   ├── views/
│   ├── services/            # 비즈니스 로직
│   └── helpers/
├── config/
│   └── routes.rb           # 라우팅 설정
├── db/
│   ├── migrate/            # 마이그레이션 파일
│   └── seeds.rb            # 시드 데이터
└── test/
    ├── models/             # 모델 테스트
    ├── controllers/        # 컨트롤러 테스트
    └── fixtures/           # 테스트 픽스처
```

## API 엔드포인트

### 인증
- `POST /login` - 로그인
- `DELETE /logout` - 로그아웃
- `POST /signup` - 회원가입

### 경기 (Games)
- `GET /games` - 경기 목록
- `GET /games/:id` - 경기 상세
- `POST /games` - 경기 생성
- `PATCH /games/:id` - 경기 수정
- `DELETE /games/:id` - 경기 삭제
- `GET /games/my_games` - 내 경기

### 팀 (Teams)
- `GET /teams` - 팀 목록
- `GET /teams/:id` - 팀 상세
- `POST /teams` - 팀 생성
- `PATCH /teams/:id` - 팀 수정
- `POST /teams/:id/join` - 팀 가입 신청
- `DELETE /teams/:id/leave` - 팀 탈퇴

### 대회 (Tournaments)
- `GET /tournaments` - 대회 목록
- `GET /tournaments/:id` - 대회 상세
- `POST /tournaments` - 대회 생성
- `PATCH /tournaments/:id` - 대회 수정
- `GET /tournaments/:id/bracket` - 대진표
- `GET /tournaments/:id/standings` - 순위표
- `GET /tournaments/:id/schedule` - 경기 일정

### 관리자 (Admin)
- `GET /admin` - 관리자 대시보드
- `GET /admin/users` - 사용자 관리
- `GET /admin/tournaments` - 대회 관리
- `GET /admin/payments` - 결제 관리
- `GET /admin/suggestions` - 건의사항 관리
- `GET /admin/system_settings` - 시스템 설정

## 테스트 실행

```bash
# 전체 테스트
bin/rails test

# 모델 테스트만
bin/rails test test/models

# 컨트롤러 테스트만
bin/rails test test/controllers

# 특정 테스트 파일
bin/rails test test/models/user_test.rb
```

## 배포

### 환경변수 (Production)

```env
RAILS_ENV=production
DATABASE_URL=postgres://...
SECRET_KEY_BASE=...
RAILS_MASTER_KEY=...

# 토스페이먼츠
TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...

# AWS S3 (파일 저장)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=...
AWS_REGION=ap-northeast-2
```

### Docker 배포

```bash
docker build -t bdr_platform .
docker run -p 3000:3000 bdr_platform
```

## 라이선스

이 프로젝트는 비공개 소프트웨어입니다. 무단 복제 및 배포를 금지합니다.

## 연락처

- 이메일: support@bdr.com
- 웹사이트: https://bdr.com
