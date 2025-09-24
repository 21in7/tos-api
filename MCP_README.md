# TOS API MCP 서버 설정 가이드

이 가이드는 Tavern of Soul API를 MCP(Model Context Protocol)를 통해 AI가 접근할 수 있도록 설정하는 방법을 설명합니다.

## 설치 및 설정

### 1. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 2. API 서버 실행
```bash
# API 서버를 먼저 실행합니다
npm start
# 또는
yarn start
```

### 3. MCP 서버 실행
```bash
# 별도 터미널에서 MCP 서버를 실행합니다
npm run mcp
# 또는
yarn mcp
```

## MCP 클라이언트 설정

### Cursor IDE 설정

#### 방법 1: 프로젝트별 설정 (권장)
프로젝트 루트의 `.cursor/mcp.json` 파일이 자동으로 인식됩니다:

```json
{
  "mcpServers": {
    "tos-api": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

#### 방법 2: Cursor 전역 설정
Cursor 설정 파일에 다음 내용을 추가하세요:

**Windows**: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`
**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`

```json
{
  "mcpServers": {
    "tos-api": {
      "command": "node",
      "args": ["E:\\develop\\tos-api\\mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Claude Desktop 설정
Claude Desktop의 설정 파일에 다음 내용을 추가하세요:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tos-api": {
      "command": "node",
      "args": ["E:\\develop\\tos-api\\mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## 사용 가능한 도구

MCP 서버는 다음 도구들을 제공합니다:

### 직업 관련
- `get_jobs`: 직업 목록 조회 (페이지네이션, 필터링 지원)
- `get_job_by_id`: ID로 직업 조회
- `get_job_by_name`: 이름으로 직업 조회
- `get_jobs_by_tree`: 직업 트리별 조회
- `get_starter_jobs`: 스타터 직업 조회
- `get_job_stats`: 직업 통계 조회

### 아이템 관련
- `get_items`: 아이템 목록 조회
- `get_item_by_id`: ID로 아이템 조회

### 스킬 관련
- `get_skills`: 스킬 목록 조회
- `get_skill_by_id`: ID로 스킬 조회

### 몬스터 관련
- `get_monsters`: 몬스터 목록 조회 (페이지네이션, 필터링 지원)
- `get_monster_by_id`: ID로 몬스터 조회
- `get_monster_by_name`: 이름으로 몬스터 조회
- `get_monsters_by_level_range`: 레벨 범위별 몬스터 조회
- `get_monster_stats`: 몬스터 통계 조회

### 기타
- `get_attributes`: 속성 목록 조회
- `get_maps`: 맵 목록 조회
- `get_dashboard_stats`: 대시보드 통계 조회

## Cursor에서 MCP 사용하기

### 1. 서버 실행
```bash
# 터미널 1: API 서버 실행
npm start

# 터미널 2: MCP 서버 실행
npm run mcp
```

### 2. Cursor에서 MCP 활성화
1. Cursor를 열고 프로젝트를 로드
2. `.cursor/mcp.json` 파일이 자동으로 인식됨
3. Cursor 하단 상태바에서 MCP 서버 연결 상태 확인
4. 채팅에서 MCP 도구 사용 가능

### 3. 사용 예시

Cursor 채팅에서 다음과 같이 질문할 수 있습니다:

- "전사 직업 트리의 모든 직업을 보여줘"
- "레벨 50-60 몬스터 목록을 알려줘"
- "검색어 '검'으로 아이템을 찾아줘"
- "직업 통계를 보여줘"
- "스타터 직업 목록을 보여줘"
- "아이템 ID 12345의 정보를 알려줘"
- "몬스터 통계를 보여줘"
- "인간 종족 몬스터 목록을 보여줘"
- "불 속성 몬스터를 찾아줘"
- "보스 등급 몬스터 목록을 보여줘"

## 문제 해결

### MCP 서버가 시작되지 않는 경우
1. API 서버가 실행 중인지 확인
2. 포트 3000이 사용 가능한지 확인
3. 의존성이 올바르게 설치되었는지 확인

### 연결 오류가 발생하는 경우
1. `API_BASE_URL` 환경 변수가 올바른지 확인
2. 방화벽 설정 확인
3. CORS 설정 확인

## 개발자 정보

- API 서버: Express.js 기반
- MCP 서버: Node.js 기반
- 데이터베이스: SQLite3
- 프로토콜: Model Context Protocol (MCP)
