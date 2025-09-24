#!/bin/bash

# Cloudflare Workers 배포 스크립트

echo "🚀 TOS API Cloudflare Workers 배포 시작..."

# 환경 확인
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI가 설치되지 않았습니다."
    echo "다음 명령어로 설치하세요: npm install -g wrangler"
    exit 1
fi

# 로그인 확인
if ! wrangler whoami &> /dev/null; then
    echo "❌ Cloudflare에 로그인되지 않았습니다."
    echo "다음 명령어로 로그인하세요: wrangler login"
    exit 1
fi

# 환경 선택
echo "배포 환경을 선택하세요:"
echo "1) 스테이징 (staging)"
echo "2) 프로덕션 (production)"
read -p "선택 (1-2): " choice

case $choice in
    1)
        ENV="staging"
        echo "📦 스테이징 환경으로 배포합니다..."
        ;;
    2)
        ENV="production"
        echo "📦 프로덕션 환경으로 배포합니다..."
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm install

# 빌드 (필요한 경우)
echo "🔨 빌드 중..."
# npm run build

# 배포
echo "🚀 Cloudflare Workers에 배포합니다..."
if [ "$ENV" = "production" ]; then
    wrangler deploy --env production
else
    wrangler deploy --env staging
fi

if [ $? -eq 0 ]; then
    echo "✅ 배포가 완료되었습니다!"
    echo "📊 로그를 확인하려면: wrangler tail --env $ENV"
    echo "🌐 대시보드: https://dash.cloudflare.com"
else
    echo "❌ 배포에 실패했습니다."
    exit 1
fi
