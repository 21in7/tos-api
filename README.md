# Tavern of Soul API

Express.js로 구현된 Tavern of Soul 게임 데이터 관리 API입니다.

## 🚀 주요 기능

- **Attributes API**: 캐릭터 속성 관리
- **Items API**: 아이템 관리 (무기, 방어구, 액세서리, 소모품, 재료)
- **Monsters API**: 몬스터 데이터 관리
- **Skills API**: 스킬 시스템 관리
- **Jobs API**: 직업 시스템 관리
- **Maps API**: 맵 데이터 관리
- **Challenges API**: 챌린지 시스템
- **Dashboard API**: 대시보드 통계
- **Planner API**: 계획 도구

## 🏗️ 아키텍처

### 마스터-슬레이브 DB 구조
- **마스터 DB**: 쓰기 작업 (INSERT, UPDATE, DELETE)
- **슬레이브 DB**: 읽기 작업 (SELECT) - 성능 최적화

### 주요 특징
- MariaDB 연결 풀 사용
- 읽기/쓰기 분리로 성능 향상
- 자동 연결 재시도
- 트랜잭션 지원

## 📋 요구사항

- Node.js 16+
- MariaDB 10.3+
- Yarn 또는 NPM

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
yarn install
```

### 2. 환경 변수 설정
`config.env.example` 파일을 참고하여 환경 변수를 설정하세요:

```bash
# 서버 설정
PORT=3000
NODE_ENV=development

# 마스터 DB 설정 (쓰기 전용)
DB_MASTER_HOST=localhost
DB_MASTER_PORT=3306
DB_MASTER_USER=root
DB_MASTER_PASSWORD=your-master-password
DB_NAME=tos_db

# 슬레이브 DB 설정 (읽기 전용)
DB_SLAVE_HOST=localhost
DB_SLAVE_PORT=3306
DB_SLAVE_USER=root
DB_SLAVE_PASSWORD=your-slave-password
```

### 3. 데이터베이스 테이블 생성
MariaDB에서 다음 테이블들을 생성해야 합니다:

```sql
-- Attributes 테이블
CREATE TABLE IF NOT EXISTS attributes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type ENUM('strength', 'agility', 'intelligence', 'vitality', 'luck') NOT NULL,
  base_value INT DEFAULT 0,
  max_value INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items 테이블
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type ENUM('weapon', 'armor', 'accessory', 'consumable', 'material') NOT NULL,
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
  level INT DEFAULT 1,
  stats JSON,
  price INT DEFAULT 0,
  stackable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 기타 테이블들도 유사하게 생성...
```

### 4. 서버 실행
```bash
# 개발 모드
yarn dev

# 프로덕션 모드
yarn start
```

## 📚 API 엔드포인트

### 기본 정보
- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

### Attributes API
```
GET    /api/attributes          # 모든 속성 조회
GET    /api/attributes/:id      # ID로 속성 조회
POST   /api/attributes          # 속성 생성
PUT    /api/attributes/:id      # 속성 업데이트
DELETE /api/attributes/:id      # 속성 삭제
GET    /api/attributes/stats    # 속성 통계
GET    /api/attributes/types    # 속성 타입 목록
```

### Items API
```
GET    /api/items               # 모든 아이템 조회
GET    /api/items/:id           # ID로 아이템 조회
POST   /api/items               # 아이템 생성
PUT    /api/items/:id           # 아이템 업데이트
DELETE /api/items/:id           # 아이템 삭제
GET    /api/items/stats         # 아이템 통계
GET    /api/items/types         # 아이템 타입 목록
GET    /api/items/rarities      # 아이템 희귀도 목록
```

### Dashboard API
```
GET    /api/dashboard/stats     # 전체 통계 조회
GET    /api/dashboard/recent    # 최근 추가된 데이터
GET    /api/dashboard/status    # 시스템 상태
GET    /api/dashboard/tables    # 테이블 정보
```

## 🔍 쿼리 파라미터

### 페이지네이션
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10, 최대: 100)

### 필터링
- `type`: 타입별 필터링
- `search`: 이름/설명 검색
- `minLevel`, `maxLevel`: 레벨 범위 필터링

### 예시
```
GET /api/items?page=1&limit=20&type=weapon&search=sword
GET /api/monsters?minLevel=10&maxLevel=20
```

## 📊 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "데이터를 조회했습니다.",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-01-23T08:30:00.000Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "오류 메시지",
  "details": "상세 오류 정보",
  "timestamp": "2025-01-23T08:30:00.000Z"
}
```

## 🚀 성능 최적화

### 읽기/쓰기 분리
- 조회 작업은 슬레이브 DB 사용
- 쓰기 작업은 마스터 DB 사용
- 자동 부하 분산

### 연결 풀
- 마스터/슬레이브 각각 10개 연결 풀
- 자동 연결 재시도
- 타임아웃 설정

## 🔧 개발

### 코드 구조
```
├── config/          # 설정 파일
├── controllers/     # 컨트롤러
├── middleware/      # 미들웨어
├── models/          # 데이터 모델
├── routes/          # 라우트
├── utils/           # 유틸리티
└── server.js        # 서버 진입점
```

### 데이터베이스 헬퍼
```javascript
// 읽기 쿼리 (슬레이브 DB)
const rows = await dbHelpers.readQuery('SELECT * FROM items');

// 쓰기 쿼리 (마스터 DB)
const result = await dbHelpers.writeQuery('INSERT INTO items ...');

// 트랜잭션 (마스터 DB)
await dbHelpers.transaction(async (connection) => {
  // 트랜잭션 로직
});
```

## 📝 라이선스

MIT License
