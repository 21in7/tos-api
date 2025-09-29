const pm2 = require('pm2');
const axios = require('axios');

// 환경변수 로드
require('dotenv').config();

// Discord 웹훅 URL (환경변수에서 가져오기)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Discord 메시지 전송 함수
async function sendDiscordNotification(title, description, color = 0xff0000) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord 웹훅 URL이 설정되지 않았습니다.');
    return;
  }

  const embed = {
    title: title,
    description: description,
    color: color,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'PM2 Monitor',
      icon_url: 'https://pm2.keymetrics.io/img/pm2-logo.png'
    }
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [embed]
    });
    console.log('Discord 알림 전송 성공');
  } catch (error) {
    console.error('Discord 알림 전송 실패:', error.message);
  }
}

// PM2 연결
pm2.connect((err) => {
  if (err) {
    console.error('PM2 연결 실패:', err);
    process.exit(2);
  }

  console.log('PM2 모니터링 시작...');

  // PM2 이벤트 리스너
  pm2.launchBus((err, bus) => {
    if (err) {
      console.error('PM2 버스 시작 실패:', err);
      return;
    }

    // 프로세스 시작 이벤트
    bus.on('process:event', (packet) => {
      const { event, process } = packet;
      
      switch (event) {
        case 'online':
          sendDiscordNotification(
            '✅ 프로세스 시작됨',
            `**${process.name}** 프로세스가 정상적으로 시작되었습니다.`,
            0x00ff00
          );
          break;
          
        case 'stopped':
          sendDiscordNotification(
            '⏹️ 프로세스 중지됨',
            `**${process.name}** 프로세스가 중지되었습니다.`,
            0xffaa00
          );
          break;
          
        case 'restart':
          sendDiscordNotification(
            '🔄 프로세스 재시작됨',
            `**${process.name}** 프로세스가 재시작되었습니다.`,
            0x0099ff
          );
          break;
          
        case 'delete':
          sendDiscordNotification(
            '🗑️ 프로세스 삭제됨',
            `**${process.name}** 프로세스가 삭제되었습니다.`,
            0x666666
          );
          break;
      }
    });

    // 에러 이벤트
    bus.on('process:exception', (packet) => {
      const { process, data } = packet;
      
      sendDiscordNotification(
        '❌ 프로세스 에러 발생',
        `**${process.name}** 프로세스에서 에러가 발생했습니다.\n\`\`\`\n${data.error}\n\`\`\``,
        0xff0000
      );
    });

    // 로그 이벤트 (에러 로그만)
    bus.on('log:err', (packet) => {
      const { process, data } = packet;
      
      // 에러 로그가 특정 키워드를 포함하는 경우만 알림
      const errorKeywords = ['error', 'Error', 'ERROR', 'failed', 'Failed', 'FAILED'];
      const hasError = errorKeywords.some(keyword => data.includes(keyword));
      
      if (hasError) {
        sendDiscordNotification(
          '⚠️ 에러 로그 감지',
          `**${process.name}** 프로세스에서 에러 로그가 감지되었습니다.\n\`\`\`\n${data.substring(0, 1000)}\n\`\`\``,
          0xff6600
        );
      }
    });
  });
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('PM2 모니터링 종료...');
  pm2.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('PM2 모니터링 종료...');
  pm2.disconnect();
  process.exit(0);
});
