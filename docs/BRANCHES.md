# BDR Platform - 브랜치 가이드

프로젝트의 Git 브랜치 구조와 작업 방법을 안내합니다.

---

## 브랜치 구조

```
main                    # 프로덕션 배포 브랜치
├── subin_dev          # Subin 개발 브랜치
└── [이름]_dev         # 개인 개발 브랜치 (필요시 생성)
```

---

## 브랜치 설명

### main
- **용도**: 프로덕션 배포용 안정 브랜치
- **배포**: Kamal을 통해 서버에 배포
- **규칙**: 직접 커밋 금지, PR을 통해서만 병합

### subin_dev
- **용도**: Subin 개발자 전용 작업 브랜치
- **생성일**: 2025-01-08
- **기반**: main 브랜치에서 분기
- **작업 내용**: 기능 개발 및 버그 수정

---

## 작업 플로우

### 1. 브랜치 전환

```bash
# subin_dev 브랜치로 전환
git checkout subin_dev

# 최신 코드 받기
git pull origin subin_dev
```

### 2. 작업 및 커밋

```bash
# 변경사항 확인
git status

# 파일 추가
git add [파일명]
# 또는 전체 추가
git add .

# 커밋
git commit -m "feat: 기능 설명"

# 푸시
git push origin subin_dev
```

### 3. main에 병합 (PR)

1. GitHub에서 Pull Request 생성
2. 코드 리뷰 진행
3. 승인 후 main에 병합
4. 배포: `kamal deploy`

---

## 커밋 메시지 규칙

```
<type>: <description>

예시:
feat: 사용자 프로필 탭 추가
fix: 로그인 오류 수정
docs: README 업데이트
style: 버튼 스타일 변경
refactor: 컨트롤러 리팩토링
test: 유닛 테스트 추가
chore: 의존성 업데이트
```

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| style | UI/CSS 변경 |
| refactor | 코드 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 기타 변경 |

---

## 새로운 개발자 브랜치 생성

다른 개발자가 참여할 경우:

```bash
# main에서 새 브랜치 생성
git checkout main
git pull origin main
git checkout -b [이름]_dev

# 원격 저장소에 푸시
git push -u origin [이름]_dev
```

---

## 주의사항

1. **main 브랜치에 직접 커밋 금지**
2. **작업 전 항상 최신 코드 pull**
3. **커밋 전 로컬에서 테스트**
4. **민감한 정보(.env, 비밀번호 등) 커밋 금지**

---

## 유용한 Git 명령어

```bash
# 브랜치 목록 확인
git branch -a

# 현재 브랜치 확인
git branch --show-current

# 변경사항 임시 저장
git stash
git stash pop

# 커밋 히스토리 확인
git log --oneline -10

# 변경사항 되돌리기 (커밋 전)
git restore [파일명]

# 브랜치 삭제 (로컬)
git branch -d [브랜치명]
```

---

## 원격 저장소

- **GitHub**: https://github.com/bdr-tech/mybdr
- **Clone URL**: `git clone https://github.com/bdr-tech/mybdr.git`
