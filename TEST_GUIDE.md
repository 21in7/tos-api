# 리팩토링 테스트 가이드

리팩토링된 API 서버를 테스트하기 위한 가이드입니다.

## 변경 사항

1. **루프 기반 라우트 등록**: `server.js`에서 언어별 라우트를 루프로 등록하여 중복 제거
2. **미들웨어를 통한 DB 헬퍼 주입**: `req.dbHelpers`가 각 요청에 자동으로 주입됨
3. **ItemController와 Item 모델**: `req.dbHelpers`를 사용하도록 업데이트

## 서버 시작

```bash
node server.js
```

서버는 `http://localhost:3000`에서 실행됩니다.

## 테스트할 엔드포인트

### 1. 기본 라우트
```
GET http://localhost:3000/
```

### 2. 기본 아이템 목록 (ktos 기본)
```
GET http://localhost:3000/api/items?page=1&limit=2
```

### 3. ktos 아이템 목록
```
GET http://localhost:3000/ktos/api/items?page=1&limit=2
```

### 4. itos 아이템 목록
```
GET http://localhost:3000/itos/api/items?page=1&limit=2
```

### 5. jtos 아이템 목록
```
GET http://localhost:3000/jtos/api/items?page=1&limit=2
```

### 6. ktos 아이템 통계
```
GET http://localhost:3000/ktos/api/items/stats
```

### 7. 기본 아이템 통계
```
GET http://localhost:3000/api/items/stats
```

### 8. 특정 아이템 조회 (ID)
```
GET http://localhost:3000/ktos/api/items/[아이템ID]
GET http://localhost:3000/itos/api/items/[아이템ID]
GET http://localhost:3000/jtos/api/items/[아이템ID]
```

## 확인 사항

각 엔드포인트 테스트 시 다음을 확인하세요:

1. ✅ **정상 응답**: HTTP 200 상태 코드
2. ✅ **언어별 라우팅**: 경로에 따라 올바른 언어가 감지되는지 (`req.language`)
3. ✅ **DB 헬퍼 주입**: `req.dbHelpers`가 올바르게 주입되어 작동하는지
4. ✅ **데이터 구조**: 응답 JSON 구조가 예상대로 나오는지
5. ✅ **페이지네이션**: 페이지네이션이 올바르게 작동하는지

## 브라우저에서 테스트

브라우저 주소창에 위 URL들을 입력하거나, 개발자 도구의 Network 탭을 통해 확인할 수 있습니다.

## curl로 테스트

```bash
# 기본 라우트
curl http://localhost:3000/

# ktos 아이템 목록
curl "http://localhost:3000/ktos/api/items?page=1&limit=2"

# itos 아이템 목록
curl "http://localhost:3000/itos/api/items?page=1&limit=2"

# jtos 아이템 목록
curl "http://localhost:3000/jtos/api/items?page=1&limit=2"
```

## PowerShell에서 테스트

```powershell
# 기본 라우트
Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing

# ktos 아이템 목록
Invoke-WebRequest -Uri "http://localhost:3000/ktos/api/items?page=1&limit=2" -UseBasicParsing

# itos 아이템 목록
Invoke-WebRequest -Uri "http://localhost:3000/itos/api/items?page=1&limit=2" -UseBasicParsing

# jtos 아이템 목록
Invoke-WebRequest -Uri "http://localhost:3000/jtos/api/items?page=1&limit=2" -UseBasicParsing
```

## 예상 결과

모든 엔드포인트는 다음과 같은 구조로 응답해야 합니다:

```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": ...,
    "totalPages": ...
  }
}
```

언어별 라우팅이 제대로 작동하면, 각 언어 경로(`/ktos/`, `/itos/`, `/jtos/`)는 해당 언어의 데이터베이스에서 데이터를 가져와야 합니다.

