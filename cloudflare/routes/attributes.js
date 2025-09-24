import { Hono } from 'hono';
import { dbHelpers } from '../config/database.js';
import { calculatePagination } from '../utils/response.js';
import { generateIconUrl } from '../utils/iconCache.js';

const attributes = new Hono();

// 모든 속성 조회 (페이지네이션)
attributes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const filters = {
      ids: c.req.query('ids'),
      type: c.req.query('type'),
      search: c.req.query('search')
    };

    const result = await findAll(page, limit, filters);
    
    return c.json({
      success: true,
      message: '속성 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('속성 목록 조회 오류:', error);
    return c.json({
      success: false,
      message: '속성 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ids로 속성 조회
attributes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await findById(id);
    
    return c.json({
      success: true,
      message: '속성을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('속성 조회 오류:', error);
    return c.json({
      success: false,
      message: '속성을 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 404);
  }
});

// 이름으로 속성 조회
attributes.get('/name/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const result = await findByName(name);
    
    if (!result) {
      return c.json({
        success: false,
        message: '속성을 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '속성을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('속성 조회 오류:', error);
    return c.json({
      success: false,
      message: '속성 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 타입별 속성 조회
attributes.get('/type/:type', async (c) => {
  try {
    const type = c.req.param('type');
    const result = await findByType(type);
    
    return c.json({
      success: true,
      message: `${type} 타입 속성들을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('타입별 속성 조회 오류:', error);
    return c.json({
      success: false,
      message: '타입별 속성 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 속성 통계 조회
attributes.get('/stats/overview', async (c) => {
  try {
    const stats = await getStats();
    
    return c.json({
      success: true,
      message: '속성 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('속성 통계 조회 오류:', error);
    return c.json({
      success: false,
      message: '속성 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 데이터베이스 함수들
async function findAll(page = 1, limit = 10, filters = {}) {
  let query = 'SELECT * FROM Attributes_attributes WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM Attributes_attributes WHERE 1=1';
  const params = [];

  // 필터 적용
  if (filters.ids) {
    query += ' AND ids = ?';
    countQuery += ' AND ids = ?';
    params.push(filters.ids);
  }

  if (filters.type) {
    query += ' AND type = ?';
    countQuery += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters.search) {
    query += ' AND (name LIKE ? OR id_name LIKE ?)';
    countQuery += ' AND (name LIKE ? OR id_name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  // 정렬
  query += ' ORDER BY id DESC';

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
      icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
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
    const query = 'SELECT * FROM Attributes_attributes WHERE ids = ?';
    const rows = await dbHelpers.readQuery(query, [ids]);
    
    if (rows.length === 0) {
      throw new Error('속성을 찾을 수 없습니다.');
    }
    
    const row = rows[0];
    return {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
    };
  } catch (error) {
    throw error;
  }
}

async function findByName(name) {
  try {
    const query = 'SELECT * FROM Attributes_attributes WHERE name = ?';
    const rows = await dbHelpers.readQuery(query, [name]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
    };
  } catch (error) {
    throw error;
  }
}

async function findByType(type) {
  try {
    const query = 'SELECT * FROM Attributes_attributes WHERE type = ?';
    const rows = await dbHelpers.readQuery(query, [type]);
    
    // 아이콘 URL 추가
    const processedRows = rows.map(row => ({
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
    }));
    
    return processedRows;
  } catch (error) {
    throw error;
  }
}

async function getStats() {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM Attributes_attributes',
      'SELECT type, COUNT(*) as count FROM Attributes_attributes GROUP BY type'
    ];
    
    const results = await Promise.all(
      queries.map(query => dbHelpers.readQuery(query))
    );
    
    return {
      total: results[0][0].total,
      byType: results[1]
    };
  } catch (error) {
    throw error;
  }
}

export default attributes;