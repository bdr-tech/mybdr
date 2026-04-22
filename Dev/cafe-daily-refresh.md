# 다음카페 쿠키 일일 갱신 루틴 (수동 30초)

> 작성: 2026-04-23 · 대상: 수빈
> 목적: 매일 쿠키 만료 대응 — **30초 수동 루틴**으로 최소화
> 히스토리: Cowork 자동화 시도(2026-04-22) → Cowork 이 Linux 샌드박스에서 실행되어 로컬 Chrome / 파일 시스템 접근 불가로 폐기 (자세한 내용은 `Dev/cafe-cowork-setup.md` 상단 아카이브 섹션 참조)

---

## ⚡ 매일 루틴

### 1회 명령 (30초)

```bash
cd "C:\0. Programing\mybdr"
npx tsx scripts/cafe-login.ts --push-secret
```

### 세부 단계

1. Chromium 창 열림 (iPhone 크기)
2. 다음 카페 로그인 페이지 표시
3. **ID 입력 필드 클릭** → Chrome 자동채움 팝업 → **카카오 계정 선택**
4. 비밀번호 자동 채움 확인
5. **"로그인" 버튼 클릭**
6. 로그인 완료 → IVHA 게시판 페이지로 이동
7. 글 1개 클릭 → **본문 보이는지 확인**
8. 터미널로 돌아와 **[Enter]**
9. 스크립트가 자동으로:
   - 쿠키 파일 저장 (`.auth/cafe-state.json`)
   - GitHub Secret 갱신 (`refresh-cafe-cookie.ts`)
10. `✅ Secret 갱신 완료` 메시지 확인

**총 소요: 20~40초** (Chrome 자동채움 덕분)

---

## ⏰ 언제 해야 하나

### 신호 1: 매일 아침 verify 메일

매일 **KST 08:10** 도착하는 `cafe-sync-verify` 메일 확인:

| severity | 의미 | 조치 |
|----------|------|------|
| **OK** | 쿠키 정상, 수집 정상 | 아무것도 할 필요 없음 |
| **WARN** | 일부 지표 경계선 | 지켜보기 |
| **ALERT** / **I4=0** | 쿠키 만료 | **30초 루틴 실행** |

### 신호 2: cafe-sync 실패 알림

`[cafe-sync] 실패 — 런 #xxxx` 제목의 메일 + "쿠키 만료 의심" 힌트 → **30초 루틴 실행**

### 신호 3: 사전 대응 (선택)

**매일 아침**(예: 출근 직후) 루틴으로 **메일 체크 없이도 루틴 실행**. 가장 안전.

---

## 🧪 성공 검증

루틴 실행 후:

1. 터미널 출력 확인:
   ```
   ✅ 쿠키 저장 완료: C:\0. Programing\mybdr\.auth\cafe-state.json
   ℹ️  세션 인증 쿠키 N개 확인 (수명 ~1일, 카카오 정책 기본)
   ...
   ✅ Secret 갱신 완료
   ```
2. 즉시 확인하고 싶으면 GitHub Actions → cafe-sync-verify **수동 run**:
   ```bash
   gh workflow run cafe-sync-verify.yml --ref main --repo bdr-tech/mybdr -f execute_issues=false -f since_hours=24
   ```
   5분 후 메일에 `severity=OK` 수신되면 성공

---

## 🚑 문제 해결

### Chromium 창이 뜨지 않음

- Playwright 브라우저 미설치 → `npx playwright install chromium` 1회 실행

### 로그인 후에도 "세션 인증 쿠키 0개" 뜸

- Chrome 자동채움이 실패 → ID/PW 수동 입력
- 로그인이 실제로 완료 안 됨 → 다시 시도

### Secret 갱신 실패 (`gh secret set` 오류)

- gh CLI 인증 풀림 → `gh auth login` 재실행
- 또는 전역 CLAUDE.md 운영 팁의 `GH_TOKEN` 재주입 방식 사용

### CAPTCHA / 2FA 뜸

- 카카오가 비정상 접근 감지 → 브라우저 내에서 수동으로 인증 완료
- 이후 [Enter] 로 스크립트 계속 진행

---

## 📋 관련 파일

| 파일 | 역할 |
|------|------|
| `scripts/cafe-login.ts` | Playwright 로그인 + storageState 저장 (+`--push-secret` 로 Secret 갱신) |
| `scripts/refresh-cafe-cookie.ts` | `.auth/cafe-state.json` → base64 → GitHub Secret 갱신 |
| `.auth/cafe-state.json` | 쿠키 저장 파일 (gitignored) |
| `.github/workflows/cafe-sync.yml` | 매시 정각 자동 수집 (쿠키 Secret 사용) |
| `.github/workflows/cafe-sync-verify.yml` | 매일 08:10 품질 검증 + 메일 리포트 |

---

## 🔮 향후 자동화 가능성

| 경로 | 가능성 | 비고 |
|------|--------|------|
| Windows 작업 스케줄러 + Playwright + 저장 ID/PW | 가능 | 관리 부담 + 카카오 봇 탐지 리스크 |
| AutoHotKey 매크로 | 가능 | 매크로 유지보수 필요 |
| Cowork / Computer Use | **불가** | 클라우드 샌드박스 실행, 로컬 자원 접근 불가 |

→ **장기 권장: 매일 30초 수동** (현재 방식)

---

## 📝 변경 히스토리

| 날짜 | 변경 |
|------|------|
| 2026-04-23 | 초안 — Cowork 폐기 후 수동 루틴 확정 |
