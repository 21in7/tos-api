@echo off
echo TOS API MCP 서버를 시작합니다...

REM 환경 변수 설정
set API_BASE_URL=http://localhost:3000
set NODE_ENV=development

REM MCP 서버 실행
node mcp-server.js

pause
