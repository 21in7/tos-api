@echo off
echo 🚀 TOS API Cloudflare Workers 배포 시작...

REM Wrangler CLI 확인
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Wrangler CLI가 설치되지 않았습니다.
    echo 다음 명령어로 설치하세요: npm install -g wrangler
    pause
    exit /b 1
)

REM 로그인 확인
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Cloudflare에 로그인되지 않았습니다.
    echo 다음 명령어로 로그인하세요: wrangler login
    pause
    exit /b 1
)

REM 환경 선택
echo 배포 환경을 선택하세요:
echo 1) 스테이징 (staging)
echo 2) 프로덕션 (production)
set /p choice="선택 (1-2): "

if "%choice%"=="1" (
    set ENV=staging
    echo 📦 스테이징 환경으로 배포합니다...
) else if "%choice%"=="2" (
    set ENV=production
    echo 📦 프로덕션 환경으로 배포합니다...
) else (
    echo ❌ 잘못된 선택입니다.
    pause
    exit /b 1
)

REM 의존성 설치
echo 📦 의존성을 설치합니다...
npm install

REM 빌드 (필요한 경우)
echo 🔨 빌드 중...
REM npm run build

REM 배포
echo 🚀 Cloudflare Workers에 배포합니다...
if "%ENV%"=="production" (
    wrangler deploy --env production
) else (
    wrangler deploy --env staging
)

if %errorlevel% equ 0 (
    echo ✅ 배포가 완료되었습니다!
    echo 📊 로그를 확인하려면: wrangler tail --env %ENV%
    echo 🌐 대시보드: https://dash.cloudflare.com
) else (
    echo ❌ 배포에 실패했습니다.
    pause
    exit /b 1
)

pause
