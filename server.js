require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initializeDatabase } = require('./config/database');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 압축 미들웨어
app.use(compression());

// 로깅 미들웨어
app.use(morgan('combined'));

// 요청 제한 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

// JSON 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use('/static', express.static(path.join(__dirname, 'public')));

// 라우트 설정
app.use('/api/attributes', require('./routes/attributes'));
app.use('/api/buffs', require('./routes/buffs'));
app.use('/api/items', require('./routes/items'));
app.use('/api/monsters', require('./routes/monsters'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/maps', require('./routes/maps'));
app.use('/api/market', require('./routes/market'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/planner', require('./routes/planner'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Tavern of Soul API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      attributes: '/api/attributes',
      buffs: '/api/buffs',
      items: '/api/items',
      monsters: '/api/monsters',
      skills: '/api/skills',
      jobs: '/api/jobs',
      maps: '/api/maps',
      market: '/api/market',
      challenges: '/api/challenges',
      dashboard: '/api/dashboard',
      planner: '/api/planner'
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
