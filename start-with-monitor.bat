@echo off
echo PM2와 Discord 모니터링 시작...

REM 환경변수 파일이 있는지 확인
if not exist .env (
    echo .env 파일이 없습니다. config.env.example을 참고하여 .env 파일을 생성해주세요.
    pause
    exit /b 1
)

REM Discord 웹훅 URL 확인
if "%DISCORD_WEBHOOK_URL%"=="" (
    echo DISCORD_WEBHOOK_URL이 설정되지 않았습니다.
    echo .env 파일에 Discord 웹훅 URL을 설정해주세요.
    pause
    exit /b 1
)

REM 기존 PM2 프로세스 정리
pm2 delete all

REM 새로운 프로세스들 시작
pm2 start ecosystem.config.js

REM 상태 확인
pm2 status

echo.
echo PM2와 Discord 모니터링이 시작되었습니다.
echo Discord 알림을 테스트하려면: node test-discord-webhook.js
echo.
pause
