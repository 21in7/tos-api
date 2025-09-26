const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Map {
  // 모든 맵 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    let query = 'SELECT * FROM Maps_maps WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Maps_maps WHERE 1=1';
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

    if (filters.level) {
      query += ' AND level = ?';
      countQuery += ' AND level = ?';
      params.push(filters.level);
    }

    if (filters.has_cm !== undefined) {
      query += ' AND has_cm = ?';
      countQuery += ' AND has_cm = ?';
      params.push(filters.has_cm);
    }

    if (filters.has_warp !== undefined) {
      query += ' AND has_warp = ?';
      countQuery += ' AND has_warp = ?';
      params.push(filters.has_warp);
    }

    if (filters.star) {
      query += ' AND star = ?';
      countQuery += ' AND star = ?';
      params.push(filters.star);
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
      const countResult = await db.readQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      const finalPagination = calculatePagination(page, limit, total);

      // 데이터 조회 (슬레이브 DB)
      const rows = await db.readQuery(query, params);

      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 맵 조회 - 슬레이브 DB 사용 (ids 컬럼으로 조회)
  static async findById(id) {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE ids = ?';
      const rows = await db.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('맵을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 맵 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE name = ?';
      const rows = await db.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      };
    } catch (error) {
      throw error;
    }
  }

  // 맵 생성 - 마스터 DB 사용
  static async create(mapData) {
    try {
      const { 
        ids,
        id_name,
        icon,
        name,
        has_cm,
        has_warp,
        level,
        max_elite,
        max_hate,
        star,
        type,
        map_link
      } = mapData;
      
      const query = `
        INSERT INTO Maps_maps (ids, id_name, icon, name, has_cm, has_warp, level, max_elite, max_hate, star, type, map_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await dbHelpers.writeQuery(query, [ids, id_name, icon, name, has_cm, has_warp, level, max_elite, max_hate, star, type, map_link]);
      
      return {
        id: result.insertId,
        ...mapData,
        monsters: monstersString,
        rewards: rewardsString,
        icon_url: icon ? `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/maps/${icon}.png` : null
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 맵 ID입니다.');
      }
      throw error;
    }
  }

  // 맵 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.');
      }

      const query = `UPDATE Maps_maps SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);

      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('맵을 찾을 수 없습니다.');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // 맵 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Maps_maps WHERE id = ?';
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('맵을 찾을 수 없습니다.');
      }
      
      return { message: '맵이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 맵 조회 - 슬레이브 DB 사용
  static async findByType(type) {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE type = ?';
      const rows = await db.readQuery(query, [type]);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 레벨별 맵 조회 - 슬레이브 DB 사용
  static async findByLevel(level) {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE level = ?';
      const rows = await db.readQuery(query, [level]);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // CM 가능 맵 조회 - 슬레이브 DB 사용
  static async findCMMaps() {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE has_cm = 1';
      const rows = await db.readQuery(query);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 워프 가능 맵 조회 - 슬레이브 DB 사용
  static async findWarpMaps() {
    try {
      const query = 'SELECT * FROM Maps_maps WHERE has_warp = 1';
      const rows = await db.readQuery(query);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'maps', 'default-map')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 맵 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Maps_maps',
        'SELECT type, COUNT(*) as count FROM Maps_maps GROUP BY type',
        'SELECT AVG(level) as avg_level FROM Maps_maps WHERE level IS NOT NULL',
        'SELECT COUNT(*) as cm_count FROM Maps_maps WHERE has_cm = 1',
        'SELECT COUNT(*) as warp_count FROM Maps_maps WHERE has_warp = 1',
        'SELECT star, COUNT(*) as count FROM Maps_maps GROUP BY star ORDER BY star'
      ];

      const [totalResult, typeResult, levelResult, cmResult, warpResult, starResult] = await Promise.all(
        queries.map(query => db.readQuery(query))
      );

      return {
        total: totalResult[0].total,
        byType: typeResult,
        avgLevel: levelResult[0].avg_level || 0,
        cmCount: cmResult[0].cm_count,
        warpCount: warpResult[0].warp_count,
        byStar: starResult
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Map;
