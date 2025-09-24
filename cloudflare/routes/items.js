import { Hono } from 'hono';
import { dbHelpers } from '../config/database-cloudflare.js';
import { calculatePagination } from '../utils/response.js';
import { generateIconUrl } from '../utils/iconCache.js';

const items = new Hono();

// 모든 아이템 조회 (페이지네이션)
items.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const filters = {
      ids: c.req.query('ids'),
      type: c.req.query('type'),
      grade: c.req.query('grade'),
      search: c.req.query('search'),
      includeEquipment: c.req.query('includeEquipment') === 'true'
    };

    const result = await findAll(page, limit, filters);
    
    return c.json({
      success: true,
      message: '아이템 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('아이템 목록 조회 오류:', error);
    return c.json({
      success: false,
      message: '아이템 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ids로 아이템 조회
items.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const includeEquipment = c.req.query('includeEquipment') === 'true';
    const result = await findById(id, includeEquipment);
    
    return c.json({
      success: true,
      message: '아이템을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('아이템 조회 오류:', error);
    return c.json({
      success: false,
      message: '아이템을 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 404);
  }
});

// 이름으로 아이템 조회
items.get('/name/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const includeEquipment = c.req.query('includeEquipment') === 'true';
    const result = await findByName(name, includeEquipment);
    
    if (!result) {
      return c.json({
        success: false,
        message: '아이템을 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '아이템을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('아이템 조회 오류:', error);
    return c.json({
      success: false,
      message: '아이템 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 아이템 통계 조회
items.get('/stats/overview', async (c) => {
  try {
    const stats = await getStats();
    
    return c.json({
      success: true,
      message: '아이템 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('아이템 통계 조회 오류:', error);
    return c.json({
      success: false,
      message: '아이템 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 데이터베이스 함수들
async function findAll(page = 1, limit = 10, filters = {}) {
  let query = 'SELECT * FROM Items_items WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM Items_items WHERE 1=1';
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

  if (filters.grade) {
    query += ' AND grade = ?';
    countQuery += ' AND grade = ?';
    params.push(filters.grade);
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
      icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
    }));

    // 장비 정보 포함 여부
    if (filters.includeEquipment) {
      for (let i = 0; i < processedRows.length; i++) {
        const item = processedRows[i];
        if (item.type === 'equipment' || item.type === 'weapon' || item.type === 'armor') {
          const equipment = await getEquipmentInfo(item.id);
          if (equipment) {
            processedRows[i] = {
              ...item,
              equipment: equipment
            };
          }
        }
      }
    }

    return {
      data: processedRows,
      pagination: finalPagination
    };
  } catch (error) {
    throw error;
  }
}

async function findById(ids, includeEquipment = false) {
  try {
    const query = 'SELECT * FROM Items_items WHERE ids = ?';
    const rows = await dbHelpers.readQuery(query, [ids]);
    
    if (rows.length === 0) {
      throw new Error('아이템을 찾을 수 없습니다.');
    }
    
    const row = rows[0];
    const result = {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
    };

    // 장비 정보 포함
    if (includeEquipment && (row.type === 'equipment' || row.type === 'weapon' || row.type === 'armor')) {
      const equipment = await getEquipmentInfo(row.id);
      if (equipment) {
        result.equipment = equipment;
      }
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

async function findByName(name, includeEquipment = false) {
  try {
    const query = 'SELECT * FROM Items_items WHERE name = ?';
    const rows = await dbHelpers.readQuery(query, [name]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    const result = {
      ...row,
      icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
    };

    // 장비 정보 포함
    if (includeEquipment && (row.type === 'equipment' || row.type === 'weapon' || row.type === 'armor')) {
      const equipment = await getEquipmentInfo(row.id);
      if (equipment) {
        result.equipment = equipment;
      }
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

async function getEquipmentInfo(itemId) {
  try {
    // 장비 기본 정보 조회
    const equipmentQuery = 'SELECT * FROM Items_equipments WHERE item_id = ?';
    const equipmentRows = await dbHelpers.readQuery(equipmentQuery, [itemId]);
    
    if (equipmentRows.length === 0) {
      return null;
    }
    
    const equipment = equipmentRows[0];
    
    // 장비 보너스 정보 조회
    const bonusQuery = 'SELECT * FROM Items_equipment_bonus WHERE equipment_id = ?';
    const bonusRows = await dbHelpers.readQuery(bonusQuery, [itemId]);
    
    return {
      ...equipment,
      bonuses: bonusRows
    };
  } catch (error) {
    console.error('장비 정보 조회 오류:', error);
    return null;
  }
}

async function getStats() {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM Items_items',
      'SELECT type, COUNT(*) as count FROM Items_items GROUP BY type',
      'SELECT grade, COUNT(*) as count FROM Items_items GROUP BY grade',
      'SELECT COUNT(*) as equipment_count FROM Items_equipments',
      'SELECT COUNT(*) as bonus_count FROM Items_equipment_bonus'
    ];
    
    const results = await Promise.all(
      queries.map(query => dbHelpers.readQuery(query))
    );
    
    return {
      total: results[0][0].total,
      byType: results[1],
      byGrade: results[2],
      equipmentCount: results[3][0].equipment_count,
      bonusCount: results[4][0].bonus_count
    };
  } catch (error) {
    throw error;
  }
}

export default items;
