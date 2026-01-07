# BDR Platform - 개발환경 세팅 가이드

이 문서는 새로운 PC에서 BDR Platform 개발환경을 처음부터 세팅하는 방법을 안내합니다.

---

## 1. 시스템 요구사항

| 항목 | 버전 | 비고 |
|------|------|------|
| **Ruby** | 3.2.2 | rbenv 또는 asdf 권장 |
| **Rails** | 8.0.4 | Gemfile에서 자동 설치 |
| **PostgreSQL** | 14+ | 로컬 설치 필요 |
| **Node.js** | 18+ | Tailwind CSS 빌드용 |
| **Git** | 최신 | - |

---

## 2. macOS 개발환경 세팅

### 2.1 Homebrew 설치 (없는 경우)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2.2 필수 패키지 설치

```bash
# Git
brew install git

# PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Node.js (Tailwind CSS 빌드용)
brew install node

# rbenv (Ruby 버전 관리)
brew install rbenv ruby-build

# rbenv 초기화 (zsh 사용 시)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### 2.3 Ruby 설치

```bash
# Ruby 3.2.2 설치
rbenv install 3.2.2
rbenv global 3.2.2

# 버전 확인
ruby -v
# => ruby 3.2.2 ...
```

---

## 3. Windows 개발환경 세팅

### 3.1 WSL2 설치 (권장)

Windows에서는 WSL2(Windows Subsystem for Linux) 사용을 권장합니다.

```powershell
# PowerShell (관리자 권한)
wsl --install -d Ubuntu
```

WSL2 설치 후 Ubuntu 터미널에서 아래 Linux 가이드를 따르세요.

### 3.2 직접 설치 (WSL 없이)

1. **RubyInstaller** 다운로드: https://rubyinstaller.org/downloads/
   - Ruby+Devkit 3.2.x (x64) 선택

2. **PostgreSQL** 다운로드: https://www.postgresql.org/download/windows/

3. **Node.js** 다운로드: https://nodejs.org/

4. **Git** 다운로드: https://git-scm.com/download/win

---

## 4. Linux (Ubuntu) 개발환경 세팅

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y git curl libssl-dev libreadline-dev zlib1g-dev \
  autoconf bison build-essential libyaml-dev libffi-dev libgdbm-dev \
  libncurses5-dev libpq-dev nodejs npm

# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# rbenv 설치
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Ruby 설치
rbenv install 3.2.2
rbenv global 3.2.2
```

---

## 5. 프로젝트 설정

### 5.1 저장소 클론

```bash
git clone https://github.com/bdr-tech/mybdr.git
cd mybdr
```

### 5.2 Ruby 버전 확인

```bash
# 프로젝트 디렉토리에서
ruby -v
# => ruby 3.2.2

# .ruby-version 파일과 일치하는지 확인
cat .ruby-version
# => 3.2.2
```

### 5.3 Bundler 및 Gem 설치

```bash
# Bundler 설치
gem install bundler

# 의존성 설치
bundle install
```

### 5.4 환경변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일 편집
# 아래 필수 항목들을 설정하세요
```

**.env 필수 설정 항목:**

```env
# Database (개발환경)
DATABASE_URL=postgresql://localhost/bdr_platform_development

# Host URL
HOST_URL=http://localhost:3000

# OAuth (Google) - 선택사항, 소셜 로그인 사용 시
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth (Kakao) - 선택사항, 소셜 로그인 사용 시
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

### 5.5 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
bin/rails db:create

# 마이그레이션 실행
bin/rails db:migrate

# 시드 데이터 로드 (테스트 계정 생성)
bin/rails db:seed
```

### 5.6 Tailwind CSS 빌드

```bash
bin/rails tailwindcss:build
```

### 5.7 서버 실행

```bash
bin/rails server
```

브라우저에서 http://localhost:3000 접속

---

## 6. 테스트 계정

시드 데이터 로드 후 사용 가능한 계정:

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 슈퍼관리자 | admin@bdr.com | password123! |
| 대회관리자 | tournament@bdr.com | password123! |
| 호스트 | host@bdr.com | password123! |
| 일반유저 | user@bdr.com | password123! |

---

## 7. 자주 사용하는 명령어

```bash
# 서버 실행
bin/rails server

# Tailwind CSS 실시간 빌드 (개발 시)
bin/rails tailwindcss:watch

# 콘솔 접속
bin/rails console

# 데이터베이스 마이그레이션
bin/rails db:migrate

# 테스트 실행
bin/rails test

# 라우트 확인
bin/rails routes
```

---

## 8. 트러블슈팅

### PostgreSQL 연결 오류

```bash
# macOS: PostgreSQL 서비스 확인
brew services list
brew services restart postgresql@14

# Linux: PostgreSQL 서비스 확인
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### Bundle install 오류 (pg gem)

```bash
# macOS
brew install libpq
bundle config build.pg --with-pg-config=$(brew --prefix libpq)/bin/pg_config
bundle install

# Linux
sudo apt install libpq-dev
bundle install
```

### Ruby 버전 불일치

```bash
# 프로젝트 Ruby 버전 설치
rbenv install 3.2.2
rbenv local 3.2.2
```

### Tailwind CSS 빌드 오류

```bash
# Node.js 버전 확인 (18+ 필요)
node -v

# 캐시 클리어 후 재빌드
bin/rails tailwindcss:build
```

---

## 9. 개발 워크플로우

```bash
# 1. 최신 코드 받기
git pull origin main

# 2. 마이그레이션 확인
bin/rails db:migrate

# 3. 서버 실행
bin/rails server

# 4. 개발 완료 후 커밋
git add .
git commit -m "변경 내용"
git push origin [브랜치명]
```

---

## 10. 추가 도구 (선택사항)

### VS Code 확장 프로그램

- **Ruby LSP** - Ruby 코드 인텔리전스
- **Tailwind CSS IntelliSense** - Tailwind 자동완성
- **Rails** - Rails 관련 스니펫
- **ERB Formatter/Beautify** - ERB 포맷팅

### 추천 설정 (.vscode/settings.json)

```json
{
  "editor.tabSize": 2,
  "files.trimTrailingWhitespace": true,
  "emmet.includeLanguages": {
    "erb": "html"
  }
}
```

---

## 11. 연락처

세팅 중 문제가 발생하면:
- GitHub Issues: https://github.com/bdr-tech/mybdr/issues
- 이메일: support@bdr.com
