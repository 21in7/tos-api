const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Item {
  // 모든 아이템 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
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
      // 총 개수 조회 (슬레이브 DB)
      const countResult = await dbHelpers.readQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      const finalPagination = calculatePagination(page, limit, total);

      // 데이터 조회 (슬레이브 DB)
      const rows = await dbHelpers.readQuery(query, params);

      // 아이콘 URL 추가 (캐시 기반)
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 아이템 조회 - 슬레이브 DB 사용
  static async findById(id) {
    try {
      const query = 'SELECT * FROM Items_items WHERE id = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 아이템 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM Items_items WHERE name = ?';
      const rows = await dbHelpers.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
      };
    } catch (error) {
      throw error;
    }
  }

  // 아이템 생성 - 마스터 DB 사용
  static async create(itemData) {
    try {
      const { 
        ids,
        id_name,
        name,
        descriptions,
        type,
        grade,
        icon,
        cooldown,
        weight,
        tradability
      } = itemData;
      
      const query = `
        INSERT INTO Items_items (ids, id_name, name, descriptions, type, grade, icon, cooldown, weight, tradability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await dbHelpers.writeQuery(query, [ids, id_name, name, descriptions, type, grade, icon, cooldown, weight, tradability]);
      
      return {
        id: result.insertId,
        ...itemData,
        icon_url: icon ? `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${icon}.png` : null
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 아이템 ID입니다.');
      }
      throw error;
    }
  }

  // 아이템 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'stats' && typeof updateData[key] === 'object') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(updateData[key]));
          } else if (key === 'type') {
            fields.push('item_type_id = (SELECT id FROM Items_item_type WHERE name = ?)');
            values.push(updateData[key]);
          } else {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
          }
        }
      });
      
      if (fields.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.');
      }
      
      values.push(id);
      
      const query = `UPDATE Items_items SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      throw error;
    }
  }

  // 아이템 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Items_items WHERE id = ?';
      
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 아이템 조회 - 슬레이브 DB 사용
  static async findByType(type) {
    try {
      const query = `
        SELECT i.*, it.name as type_name 
        FROM Items_items i 
        JOIN Items_item_type it ON i.item_type_id = it.id 
        WHERE it.name = ? 
        ORDER BY i.level, i.name
      `;
      const rows = await dbHelpers.readQuery(query, [type]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 희귀도별 아이템 조회 - 슬레이브 DB 사용
  static async findByRarity(rarity) {
    try {
      const query = 'SELECT * FROM Items_items WHERE rarity = ? ORDER BY level DESC, name';
      const rows = await dbHelpers.readQuery(query, [rarity]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 레벨 범위별 아이템 조회 - 슬레이브 DB 사용
  static async findByLevelRange(minLevel, maxLevel) {
    try {
      const query = 'SELECT * FROM Items_items WHERE level >= ? AND level <= ? ORDER BY level, name';
      const rows = await dbHelpers.readQuery(query, [minLevel, maxLevel]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 아이템 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Items_items',
        'SELECT it.name as type, COUNT(*) as count FROM Items_items i JOIN Items_item_type it ON i.item_type_id = it.id GROUP BY it.name',
        'SELECT rarity, COUNT(*) as count FROM Items_items GROUP BY rarity',
        'SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM Items_items',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM Items_items'
      ];
      
      const results = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        byType: results[1],
        byRarity: results[2],
        priceStats: results[3][0],
        levelStats: results[4][0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Item;
