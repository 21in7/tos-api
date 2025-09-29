const axios = require('axios');

// 환경변수 로드
require('dotenv').config();

// Discord 웹훅 URL (환경변수에서 가져오기)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function testDiscordWebhook() {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('❌ Discord 웹훅 URL이 설정되지 않았습니다.');
    console.log('config.env 파일에 DISCORD_WEBHOOK_URL을 설정해주세요.');
    return;
  }

  const embed = {
    title: '🧪 Discord 웹훅 테스트',
    description: 'PM2 모니터링 시스템이 정상적으로 작동합니다!',
    color: 0x00ff00,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'PM2 Monitor Test',
      icon_url: 'https://pm2.keymetrics.io/img/pm2-logo.png'
    },
    fields: [
      {
        name: '서버',
        value: 'TOS API Server',
        inline: true
      },
      {
        name: '상태',
        value: '정상 작동',
        inline: true
      }
    ]
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [embed]
    });
    console.log('✅ Discord 알림 테스트 성공!');
  } catch (error) {
    console.error('❌ Discord 알림 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
  }
}

testDiscordWebhook();
