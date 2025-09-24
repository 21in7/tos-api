// Cloudflare Workers용 핸들러
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// 라우트 임포트
import attributes from './routes/attributes.js';
import monsters from './routes/monsters.js';
import items from './routes/items.js';
// import buffs from './routes/buffs.js';
// import skills from './routes/skills.js';
// import jobs from './routes/jobs.js';
// import maps from './routes/maps.js';
// import challenges from './routes/challenges.js';
// import dashboard from './routes/dashboard.js';
// import planner from './routes/planner.js';

const app = new Hono();

// 미들웨어 설정
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://your-domain.com'],
  credentials: true
}));
app.use('*', prettyJSON());

// 기본 라우트
app.get('/', (c) => {
  return c.json({
    message: 'Tavern of Soul API 서버가 Cloudflare Workers에서 실행 중입니다.',
    version: '1.0.0',
    environment: 'cloudflare-workers',
    endpoints: {
      attributes: '/api/attributes',
      buffs: '/api/buffs',
      items: '/api/items',
      monsters: '/api/monsters',
      skills: '/api/skills',
      jobs: '/api/jobs',
      maps: '/api/maps',
      challenges: '/api/challenges',
      dashboard: '/api/dashboard',
      planner: '/api/planner'
    }
  });
});

// API 라우트 설정
app.route('/api/attributes', attributes);
app.route('/api/monsters', monsters);
app.route('/api/items', items);
// app.route('/api/buffs', buffs);
// app.route('/api/skills', skills);
// app.route('/api/jobs', jobs);
// app.route('/api/maps', maps);
// app.route('/api/challenges', challenges);
// app.route('/api/dashboard', dashboard);
// app.route('/api/planner', planner);

// 404 핸들러
app.notFound((c) => {
  return c.json({
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: c.req.url
  }, 404);
});

// 에러 핸들러
app.onError((err, c) => {
  console.error('서버 에러:', err);
  return c.json({
    error: '서버 내부 오류가 발생했습니다.',
    message: err.message
  }, 500);
});

export default app;
