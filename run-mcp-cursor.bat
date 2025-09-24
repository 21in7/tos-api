@echo off
echo Cursor용 TOS API MCP 서버를 시작합니다...

REM 현재 디렉토리를 스크립트 위치로 변경
cd /d "%~dp0"

REM 환경 변수 설정
set API_BASE_URL=http://localhost:3000
set NODE_ENV=development

REM MCP 서버 실행
echo MCP 서버 시작 중...
node mcp-server.js

pause
