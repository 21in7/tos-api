require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { initializeDatabase } = require('./config/database');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: false, // API 서버이므로 CSP 비활성화
  crossOriginEmbedderPolicy: false
}));

// Nginx Proxy Manager 및 Cloudflare를 통한 요청을 위한 신뢰할 수 있는 프록시 설정
app.set('trust proxy', true);

// HTTPS 리다이렉트 미들웨어 (SSL 인증서 제거로 인해 비활성화)
app.use((req, res, next) => {
  // Cloudflare를 통한 요청인 경우 HTTPS 강제하지 않음
  if (req.header('x-forwarded-proto') === 'https' || req.header('cf-visitor')) {
    next();
  } else {
    // HTTP 요청도 허용 (개발/테스트용)
    next();
  }
});

// Cloudflare IP 범위 확인 (선택사항)
const cloudflareIPs = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22'
];

// CORS 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3000',
    'https://api.gihyeonofsoul.com', // 실제 도메인
    'https://gihyeonofsoul.com', // 메인 도메인
    'https://*.gihyeonofsoul.com', // 서브도메인 허용
    'https://api-jp.gihyeonofsoul.com', // 일본어 API 도메인
    'https://*.api-jp.gihyeonofsoul.com' // 일본어 서브도메인 허용
  ],
  credentials: true
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
app.use(morgan('combined'));

// 요청 제한 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 프로덕션: 100, 개발: 1000
  message: {
    error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true, // `RateLimit-*` 헤더 반환
  legacyHeaders: false, // `X-RateLimit-*` 헤더 비활성화
  keyGenerator: (req) => {
    // Nginx Proxy Manager를 통한 요청인 경우 X-Forwarded-For 헤더 사용
    const forwardedFor = req.get('X-Forwarded-For');
    if (forwardedFor) {
      // X-Forwarded-For: client, proxy1, proxy2
      // 첫 번째 IP가 실제 클라이언트 IP
      return forwardedFor.split(',')[0].trim();
    }
    return req.ip;
  },
  skip: (req, res) => {
    // 개발 환경에서 localhost는 제한 제외
    if (process.env.NODE_ENV !== 'production' && req.ip === '127.0.0.1') {
      return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

// JSON 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 캐시 방지 헤더 (개발 환경에서)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    next();
  });
}

// 정적 파일은 R2 버킷에서 직접 서빙

// robots.txt 라우트 (모든 봇 차단)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /

# 모든 봇 차단
# API 서버이므로 크롤링 금지
# Crawl-delay: 86400`); // 24시간 지연
});

// 봇 차단을 위한 추가 미들웨어
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /scanner/i,
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    /baiduspider/i, /yandexbot/i, /facebookexternalhit/i,
    /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegrambot/i,
    /discordbot/i, /slackbot/i, /curl/i, /wget/i, /python/i,
    /java/i, /php/i, /ruby/i, /perl/i, /go-http/i, /okhttp/i
  ];
  
  // 봇 감지 시 403 Forbidden 응답
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Bot crawling is not allowed on this API server',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// 언어별 라우팅 미들웨어 (라우트 설정 이전에 위치)
app.use((req, res, next) => {
  // 언어 감지 (경로 기반)
  const originalPath = req.originalUrl;
  let lang = 'ktos'; // 기본값

  if (originalPath.startsWith('/ktos/')) {
    lang = 'ktos';
  } else if (originalPath.startsWith('/itos/')) {
    lang = 'itos';
  } else if (originalPath.startsWith('/jtos/')) {
    lang = 'jtos';
  }

  // 언어 정보를 req 객체에 저장
  req.language = lang;

  try {
    req.dbHelpers = require('./config/database').getDbHelpers(lang);
  } catch (e) {
    console.error(`[DB Helper Error] Failed to get dbHelpers for ${lang}:`, e);
    // Don't crash, but db usage will fail
  }

  console.log(`[라우팅] 경로: ${originalPath}, 감지된 언어: ${lang}`);
  next();
});

// Resource routes definition
const resources = [
  'attributes',
  'buffs',
  'items',
  'monsters',
  'skills',
  'jobs',
  'maps',
  'dashboard'
];

// Languages to support
const languages = ['ktos', 'itos', 'jtos'];

// Register routes for each language
languages.forEach(lang => {
  resources.forEach(resource => {
    app.use(`/${lang}/api/${resource}`, require(`./routes/${resource}`));
  });
});

// Register default routes (ktos) - set at the end
resources.forEach(resource => {
  app.use(`/api/${resource}`, require(`./routes/${resource}`));
});


// 기본 라우트
app.get('/', (req, res) => {
  const lang = req.language || 'ktos';
  res.json({
    message: `Gihyeon of Soul API 서버가 실행 중입니다. (${lang.toUpperCase()})`,
    version: '1.0.0',
    language: lang,
    endpoints: {
      attributes: `/api/attributes`,
      buffs: `/api/buffs`,
      items: `/api/items`,
      monsters: `/api/monsters`,
      skills: `/api/skills`,
      jobs: `/api/jobs`,
      maps: `/api/maps`,
      dashboard: `/api/dashboard`,
    },
        languageEndpoints: {
          korean: {
            base: '/ktos/api',
            example: '/ktos/api/items'
          },
          english: {
            base: '/itos/api',
            example: '/itos/api/items'
          },
          japanese: {
            base: '/jtos/api',
            example: '/jtos/api/items'
          }
        }
  });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 Tavern of Soul API 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📊 API 문서: http://localhost:${PORT}`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

startServer();

module.exports = app;
