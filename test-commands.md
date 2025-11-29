# API 서버 테스트 명령어

현재 서버가 `http://localhost:3000`에서 실행 중입니다. 아래 명령어들을 사용하여 테스트할 수 있습니다.

## PowerShell에서 테스트

### 1. 기본 라우트
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get | ConvertTo-Json -Depth 5
```

### 2. 기본 아이템 목록 (ktos)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/items?page=1&limit=2" -Method Get | ConvertTo-Json -Depth 5
```

### 3. ktos 아이템 목록
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/ktos/api/items?page=1&limit=2" -Method Get | ConvertTo-Json -Depth 5
```

### 4. itos 아이템 목록
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/itos/api/items?page=1&limit=2" -Method Get | ConvertTo-Json -Depth 5
```

### 5. jtos 아이템 목록
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/jtos/api/items?page=1&limit=2" -Method Get | ConvertTo-Json -Depth 5
```

### 6. ktos 아이템 통계
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/ktos/api/items/stats" -Method Get | ConvertTo-Json -Depth 5
```

### 7. 기본 아이템 통계
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/items/stats" -Method Get | ConvertTo-Json -Depth 5
```

## Node.js 스크립트로 테스트

```bash
node quick-test.js
```

또는

```bash
node test-api.js
```

## 브라우저에서 테스트

1. `test-api.html` 파일을 브라우저에서 열기
2. 각 버튼을 클릭하여 테스트
3. "모든 테스트 실행" 버튼으로 한 번에 테스트

## curl로 테스트 (Git Bash 또는 WSL 사용 시)

```bash
# 기본 라우트
curl http://localhost:3000/

# ktos 아이템
curl "http://localhost:3000/ktos/api/items?page=1&limit=2"

# itos 아이템
curl "http://localhost:3000/itos/api/items?page=1&limit=2"

# jtos 아이템
curl "http://localhost:3000/jtos/api/items?page=1&limit=2"
```

## 확인할 사항

각 엔드포인트 테스트 시 다음을 확인하세요:

1. ✅ **HTTP 200 응답**: 모든 요청이 성공적으로 응답하는지
2. ✅ **언어별 라우팅**: `/ktos/`, `/itos/`, `/jtos/` 경로가 올바르게 작동하는지
3. ✅ **데이터 구조**: JSON 응답이 예상한 구조인지
4. ✅ **페이지네이션**: 페이지네이션이 올바르게 작동하는지
5. ✅ **req.dbHelpers**: 각 요청이 올바른 데이터베이스 헬퍼를 사용하는지

