# Cloudflare Workers 빠른 시작 가이드

## 🚀 빠른 배포

### 1. 의존성 설치
```bash
cd cloudflare
npm install
```

### 2. Cloudflare 로그인
```bash
npx wrangler login
```

### 3. 로컬 개발
```bash
npm run dev
```

### 4. 배포
```bash
npm run deploy
```

## 📁 폴더 구조

```
cloudflare/
├── worker.js              # 메인 핸들러
├── wrangler.toml          # Cloudflare 설정
├── package.json           # 의존성 관리
├── routes/                # API 라우트
│   ├── attributes.js      # 속성 API
│   └── monsters.js        # 몬스터 API
├── config/                # 설정 파일
│   └── database-cloudflare.js
├── utils/                 # 유틸리티
│   ├── response.js
│   └── iconCache.js
├── deploy.sh              # Linux/Mac 배포 스크립트
├── deploy.bat             # Windows 배포 스크립트
└── README.md              # 상세 가이드
```

## 🔧 현재 지원되는 API

- ✅ `/api/attributes` - 속성 API
- ✅ `/api/monsters` - 몬스터 API
- 🚧 `/api/buffs` - 버프 API (준비 중)
- 🚧 `/api/items` - 아이템 API (준비 중)
- 🚧 `/api/skills` - 스킬 API (준비 중)

## 🌐 배포 후 접근

배포가 완료되면 다음과 같은 URL로 접근할 수 있습니다:

```
https://your-worker-name.your-subdomain.workers.dev
```

## 📊 모니터링

```bash
# 실시간 로그 확인
npm run tail

# 특정 환경 로그
npx wrangler tail --env production
```

## 🛠️ 문제 해결

### 의존성 오류
```bash
rm -rf node_modules package-lock.json
npm install
```

### 배포 오류
```bash
npx wrangler whoami
npx wrangler login
```

### 로컬 개발 오류
```bash
npx wrangler dev --local
```
