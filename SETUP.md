# BDR Platform - 초기 세팅 가이드

새 PC에서 BDR Platform 프로젝트를 설정하는 방법입니다.

---

## 1. 필수 요구사항

### 시스템 요구사항
- **OS**: macOS, Linux, Windows (WSL2 권장)
- **Ruby**: 3.2.2
- **PostgreSQL**: 14+
- **Node.js**: 18+ (Tailwind CSS 빌드용)

---

## 2. 개발 환경 설치

### macOS (Homebrew)

```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# rbenv 설치 (Ruby 버전 관리)
brew install rbenv ruby-build
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Ruby 3.2.2 설치
rbenv install 3.2.2
rbenv global 3.2.2

# PostgreSQL 설치 및 시작
brew install postgresql@14
brew services start postgresql@14

# Node.js 설치 (nvm 사용 권장)
brew install nvm
nvm install 18
nvm use 18
```

### Ubuntu/Debian

```bash
# 필수 패키지
sudo apt update
sudo apt install -y build-essential libssl-dev libreadline-dev zlib1g-dev \
  libpq-dev nodejs npm git curl

# rbenv 설치
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# Ruby 설치
rbenv install 3.2.2
rbenv global 3.2.2

# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 3. 프로젝트 설정

### 3.1 저장소 클론

```bash
git clone <repository-url> bdr_platform
cd bdr_platform
```

### 3.2 환경변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env  # 예제 파일이 있는 경우
# 또는 직접 생성
```

`.env` 파일 내용:

```env
# Database
DATABASE_URL=postgresql://localhost/bdr_platform_development

# Rails
RAILS_MAX_THREADS=5

# OAuth - Google (구글 콘솔에서 발급)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - Kakao (카카오 개발자에서 발급)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Host
HOST_URL=http://localhost:3000
```

### 3.3 의존성 설치

```bash
# Bundler 설치
gem install bundler

# Gem 설치
bundle install
```

### 3.4 데이터베이스 설정

```bash
# PostgreSQL 사용자 생성 (필요한 경우)
createuser -s $USER  # macOS
# 또는
sudo -u postgres createuser -s $USER  # Linux

# 데이터베이스 생성 및 마이그레이션
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed
```

---

## 4. 서버 실행

### 개발 서버 실행

```bash
# 기본 (포트 3000)
bin/rails server

# 특정 포트로 실행
PORT=3030 bin/rails server

# Tailwind CSS 와치 모드 (별도 터미널)
bin/rails tailwindcss:watch
```

### Procfile.dev 사용 (권장)

```bash
# foreman 설치
gem install foreman

# Rails + Tailwind 동시 실행
bin/dev
```

---

## 5. 테스트 계정

시드 데이터 생성 후 사용 가능한 테스트 계정:

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 슈퍼관리자 | admin@bdr.com | admin123 |
| 대회관리자 | tournament@bdr.com | admin123 |
| 픽업호스트 | pickup@bdr.com | admin123 |
| 유료회원 | pro@bdr.com | password123 |
| 일반회원 | user@bdr.com | password123 |

---

## 6. 유용한 명령어

```bash
# 데이터베이스 리셋 (주의: 모든 데이터 삭제)
bin/rails db:reset

# Tailwind CSS 빌드
bin/rails tailwindcss:build

# Rails 콘솔
bin/rails console

# 테스트 실행
bin/rails test

# 코드 품질 검사
bundle exec rubocop

# 보안 검사
bundle exec brakeman
```

---

## 7. 트러블슈팅

### PostgreSQL 연결 오류

```bash
# PostgreSQL 실행 상태 확인
brew services list  # macOS
systemctl status postgresql  # Linux

# PostgreSQL 재시작
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql  # Linux
```

### Bundler 오류

```bash
# Bundler 재설치
gem uninstall bundler
gem install bundler

# Lock 파일 삭제 후 재설치
rm Gemfile.lock
bundle install
```

### pg gem 설치 실패 (macOS)

```bash
# PostgreSQL 경로 지정
gem install pg -- --with-pg-config=$(brew --prefix postgresql@14)/bin/pg_config
```

### Tailwind CSS 빌드 오류

```bash
# Tailwind 재설치
bin/rails tailwindcss:install
```

---

## 8. 디렉토리 구조

```
bdr_platform/
├── app/
│   ├── controllers/     # 컨트롤러
│   ├── models/          # 모델
│   ├── views/           # 뷰 템플릿
│   ├── assets/          # CSS, 이미지
│   └── services/        # 서비스 객체
├── config/              # 설정 파일
├── db/
│   ├── migrate/         # 마이그레이션
│   ├── schema.rb        # 스키마 정의
│   └── seeds.rb         # 시드 데이터
├── docs/                # 문서
├── test/                # 테스트
├── .env                 # 환경변수 (Git 제외)
└── CLAUDE.md            # Claude Code 지침
```

---

## 9. 빠른 시작 (Quick Start)

모든 설정이 완료된 후 한 번에 실행:

```bash
# 1. 의존성 설치 + DB 설정 + 서버 실행
bin/setup

# 또는 수동으로
bundle install && bin/rails db:prepare && bin/dev
```

---

## 10. 추가 설정 (선택)

### OAuth 설정

1. **Google OAuth**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 새 프로젝트 생성 → OAuth 동의 화면 설정
   - 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI: `http://localhost:3000/auth/google_oauth2/callback`

2. **Kakao OAuth**
   - [Kakao Developers](https://developers.kakao.com/) 접속
   - 애플리케이션 생성 → 앱 키 발급
   - 플랫폼 등록 (Web) → 도메인 등록
   - 카카오 로그인 활성화 → Redirect URI 설정

---

**문서 작성일**: 2024년 12월
**Rails 버전**: 8.0.4
**Ruby 버전**: 3.2.2
