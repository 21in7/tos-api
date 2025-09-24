import { Hono } from 'hono';
import { dbHelpers } from '../config/database-cloudflare.js';
import { calculatePagination } from '../utils/response.js';
import { generateIconUrl } from '../utils/iconCache.js';

const monsters = new Hono();

// 모든 몬스터 조회 (페이지네이션)
monsters.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const filters = {
      ids: c.req.query('ids'),
      minLevel: c.req.query('minLevel') ? parseInt(c.req.query('minLevel')) : undefined,
      maxLevel: c.req.query('maxLevel') ? parseInt(c.req.query('maxLevel')) : undefined,
      race: c.req.query('race'),
      rank: c.req.query('rank'),
      element: c.req.query('element'),
      search: c.req.query('search'),
      validOnly: c.req.query('validOnly') !== 'false'
    };

    const result = await findAll(page, limit, filters);
    
    return c.json({
      success: true,
      message: '몬스터 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('몬스터 목록 조회 오류:', error);
    return c.json({
      success: false,
      message: '몬스터 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ids로 몬스터 조회
monsters.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await findById(id);
    
    return c.json({
      success: true,
      message: '몬스터를 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('몬스터 조회 오류:', error);
    return c.json({
      success: false,
      message: '몬스터를 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 404);
  }
});

// 이름으로 몬스터 조회
monsters.get('/name/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const result = await findByName(name);
    
    if (!result) {
      return c.json({
        success: false,
        message: '몬스터를 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '몬스터를 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('몬스터 조회 오류:', error);
    return c.json({
      success: false,
      message: '몬스터 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 레벨 범위별 몬스터 조회
monsters.get('/level/:minLevel/:maxLevel', async (c) => {
  try {
    const minLevel = parseInt(c.req.param('minLevel'));
    const maxLevel = parseInt(c.req.param('maxLevel'));
    const result = await findByLevelRange(minLevel, maxLevel);
    
    return c.json({
      success: true,
      message: `레벨 ${minLevel}-${maxLevel} 몬스터들을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('레벨 범위별 몬스터 조회 오류:', error);
    return c.json({
      success: false,
      message: '레벨 범위별 몬스터 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 몬스터 통계 조회
monsters.get('/stats/overview', async (c) => {
  try {
    const stats = await getStats();
    
    return c.json({
      success: true,
      message: '몬스터 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('몬스터 통계 조회 오류:', error);
    return c.json({
      success: false,
      message: '몬스터 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 데이터베이스 함수들
async function findAll(page = 1, limit = 10, filters = {}) {
  let query = 'SELECT * FROM Monsters_monsters WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM Monsters_monsters WHERE 1=1';
  const params = [];

  // 기본 필터: 빈 데이터 제외
  query += ' AND name IS NOT NULL AND name != ""';
  query += ' AND ids IS NOT NULL AND ids != ""';
  query += ' AND level > 0';
  query += ' AND name NOT LIKE "%임시%"';
  query += ' AND name NOT LIKE "%boss_%"';
  query += ' AND name NOT LIKE "%DynamicObject%"';
  query += ' AND name NOT LIKE "%Symbol_%"';
  query += ' AND name NOT LIKE "%( 임시)%"';
  query += ' AND name NOT LIKE "%Blizzard%"';
  query += ' AND rank NOT IN ("Material", "MISC")';
  countQuery += ' AND name IS NOT NULL AND name != ""';
  countQuery += ' AND ids IS NOT NULL AND ids != ""';
  countQuery += ' AND level > 0';
  countQuery += ' AND name NOT LIKE "%임시%"';
  countQuery += ' AND name NOT LIKE "%boss_%"';
  countQuery += ' AND name NOT LIKE "%DynamicObject%"';
  countQuery += ' AND name NOT LIKE "%Symbol_%"';
  countQuery += ' AND name NOT LIKE "%( 임시)%"';
  countQuery += ' AND name NOT LIKE "%Blizzard%"';
  countQuery += ' AND rank NOT IN ("Material", "MISC")';

  // 필터 적용
  if (filters.ids) {
    query += ' AND ids = ?';
    countQuery += ' AND ids = ?';
    params.push(filters.ids);
  }

  if (filters.minLevel) {
    query += ' AND level >= ?';
    countQuery += ' AND level >= ?';
    params.push(filters.minLevel);
  }

  if (filters.maxLevel) {
    query += ' AND level <= ?';
    countQuery += ' AND level <= ?';
    params.push(filters.maxLevel);
  }

  if (filters.race) {
    query += ' AND race = ?';
    countQuery += ' AND race = ?';
    params.push(filters.race);
  }

  if (filters.rank) {
    query += ' AND rank = ?';
    countQuery += ' AND rank = ?';
    params.push(filters.rank);
  }

  if (filters.element) {
    query += ' AND element = ?';
    countQuery += ' AND element = ?';
    params.push(filters.element);
  }

  if (filters.search) {
    query += ' AND (name LIKE ? OR id_name LIKE ?)';
    countQuery += ' AND (name LIKE ? OR id_name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  // 추가 필터: 유효한 데이터만 조회
  if (filters.validOnly !== false) {
    query += ' AND hp > 0';
    countQuery += ' AND hp > 0';
  }

  // 정렬
  query += ' ORDER BY level, name';

  // 페이지네이션
  const pagination = calculatePagination(page, limit, 0);
  query += ' LIMIT ? OFFSET ?';
  params.push(pagination.limit, pagination.offset);

  try {
    // 총 개수 조회
    const countResult = await dbHelpers.readQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;
    const finalPagination = calculatePagination(page, limit, total);

    // 데이터 조회
    const rows = await dbHelpers.readQuery(query, params);

    // 아이콘 URL 추가
    const processedRows = rows.map(row => ({
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-monster')
    }));

    return {
      data: processedRows,
      pagination: finalPagination
    };
  } catch (error) {
    throw error;
  }
}

async function findById(ids) {
  try {
    const query = 'SELECT * FROM Monsters_monsters WHERE ids = ?';
    const rows = await dbHelpers.readQuery(query, [ids]);
    
    if (rows.length === 0) {
      throw new Error('몬스터를 찾을 수 없습니다.');
    }
    
    const row = rows[0];
    return {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-monster')
    };
  } catch (error) {
    throw error;
  }
}

async function findByName(name) {
  try {
    const query = 'SELECT * FROM Monsters_monsters WHERE name = ?';
    const rows = await dbHelpers.readQuery(query, [name]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-monster')
    };
  } catch (error) {
    throw error;
  }
}

async function findByLevelRange(minLevel, maxLevel) {
  try {
    const query = 'SELECT * FROM Monsters_monsters WHERE level >= ? AND level <= ? ORDER BY level, name';
    const rows = await dbHelpers.readQuery(query, [minLevel, maxLevel]);
    
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getStats() {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM Monsters_monsters',
      'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM Monsters_monsters',
      'SELECT AVG(hp) as avg_hp, MIN(hp) as min_hp, MAX(hp) as max_hp FROM Monsters_monsters',
      'SELECT AVG(patk_max) as avg_patk, MIN(patk_max) as min_patk, MAX(patk_max) as max_patk FROM Monsters_monsters',
      'SELECT AVG(matk_max) as avg_matk, MIN(matk_max) as min_matk, MAX(matk_max) as max_matk FROM Monsters_monsters',
      'SELECT AVG(exp) as avg_exp, MIN(exp) as min_exp, MAX(exp) as max_exp FROM Monsters_monsters',
      'SELECT race, COUNT(*) as count FROM Monsters_monsters WHERE race IS NOT NULL GROUP BY race',
      'SELECT rank, COUNT(*) as count FROM Monsters_monsters WHERE rank IS NOT NULL GROUP BY rank',
      'SELECT element, COUNT(*) as count FROM Monsters_monsters WHERE element IS NOT NULL GROUP BY element'
    ];
    
    const results = await Promise.all(
      queries.map(query => dbHelpers.readQuery(query))
    );
    
    return {
      total: results[0][0].total,
      levelStats: results[1][0],
      hpStats: results[2][0],
      patkStats: results[3][0],
      matkStats: results[4][0],
      expStats: results[5][0],
      raceDistribution: results[6],
      rankDistribution: results[7],
      elementDistribution: results[8]
    };
  } catch (error) {
    throw error;
  }
}

export default monsters;
