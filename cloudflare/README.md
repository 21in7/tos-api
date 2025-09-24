# Cloudflare Workers 배포 가이드

이 가이드는 TOS API를 Cloudflare Workers로 배포하는 방법을 설명합니다.

## 🚀 배포 옵션

### 1. Cloudflare Workers (권장)
- **장점**: 서버리스, 글로벌 CDN, 빠른 응답
- **제한**: CPU 시간 제한 (10ms 무료, 50ms 유료)
- **용도**: API 서버, 실시간 처리

### 2. Cloudflare Pages Functions
- **장점**: 정적 사이트 + API 함수
- **제한**: 함수 실행 시간 제한
- **용도**: 정적 사이트 + API 조합

## 📋 사전 준비

### 1. Cloudflare 계정 생성
- [Cloudflare 대시보드](https://dash.cloudflare.com) 가입
- Workers & Pages 활성화

### 2. Wrangler CLI 설치
```bash
npm install -g wrangler
wrangler login
```

### 3. 데이터베이스 설정
다음 중 하나를 선택:

#### 옵션 A: Cloudflare D1 (SQLite)
```bash
# D1 데이터베이스 생성
wrangler d1 create tos-database

# 데이터베이스 바인딩 추가
wrangler d1 execute tos-database --file=./database/schema.sql
```

#### 옵션 B: 외부 데이터베이스 (PlanetScale, Neon 등)
- HTTP API를 통한 데이터베이스 연결
- 환경 변수에 API 키 설정

## 🔧 설정 단계

### 1. 프로젝트 설정
```bash
# Cloudflare Workers용 패키지 설치
npm install hono wrangler

# 또는 기존 package.json에 추가
npm install --save hono
npm install --save-dev wrangler
```

### 2. 환경 변수 설정
`wrangler.toml` 파일에서 환경 변수 설정:

```toml
[vars]
NODE_ENV = "production"
API_VERSION = "1.0.0"

# D1 데이터베이스 바인딩
[[d1_databases]]
binding = "DB"
database_name = "tos-database"
database_id = "your-database-id"

# R2 버킷 바인딩 (선택사항)
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "tos-assets"
```

### 3. 데이터베이스 마이그레이션
```bash
# D1 데이터베이스에 스키마 적용
wrangler d1 execute tos-database --file=./database/schema.sql

# 데이터 임포트 (선택사항)
wrangler d1 execute tos-database --file=./database/data.sql
```

## 🚀 배포 과정

### 1. 로컬 개발
```bash
# 로컬 개발 서버 실행
wrangler dev

# 특정 환경으로 실행
wrangler dev --env staging
```

### 2. 스테이징 배포
```bash
# 스테이징 환경 배포
wrangler deploy --env staging
```

### 3. 프로덕션 배포
```bash
# 프로덕션 환경 배포
wrangler deploy --env production
```

## 📊 모니터링 및 관리

### 1. 로그 확인
```bash
# 실시간 로그 확인
wrangler tail

# 특정 환경 로그
wrangler tail --env production
```

### 2. 메트릭 확인
- Cloudflare 대시보드에서 Workers 메트릭 확인
- 요청 수, 응답 시간, 에러율 모니터링

### 3. 환경 변수 관리
```bash
# 환경 변수 설정
wrangler secret put DB_API_KEY

# 환경 변수 확인
wrangler secret list
```

## 🔄 CI/CD 설정

### GitHub Actions 예시
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

## 🛠️ 최적화 팁

### 1. 성능 최적화
- 데이터베이스 쿼리 최적화
- 캐싱 전략 구현
- 불필요한 의존성 제거

### 2. 보안 설정
- CORS 설정 최적화
- API 키 보안 관리
- Rate Limiting 구현

### 3. 모니터링
- 에러 추적 설정
- 성능 메트릭 수집
- 알림 설정

## 📝 환경별 설정

### 개발 환경
```bash
wrangler dev --local
```

### 스테이징 환경
```bash
wrangler deploy --env staging
```

### 프로덕션 환경
```bash
wrangler deploy --env production
```

## 🚨 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 오류**
   - 환경 변수 확인
   - 데이터베이스 바인딩 확인

2. **CORS 오류**
   - CORS 설정 확인
   - 도메인 허용 목록 확인

3. **메모리 부족**
   - 코드 최적화
   - 불필요한 의존성 제거

### 디버깅
```bash
# 상세 로그 확인
wrangler tail --format=pretty

# 로컬 디버깅
wrangler dev --local --inspect
```

## 📚 추가 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Hono 프레임워크](https://hono.dev/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [D1 데이터베이스](https://developers.cloudflare.com/d1/)

## 🎯 다음 단계

1. **도메인 설정**: 커스텀 도메인 연결
2. **SSL 인증서**: 자동 SSL 설정
3. **CDN 최적화**: 글로벌 캐싱 설정
4. **모니터링**: 알림 및 대시보드 설정
