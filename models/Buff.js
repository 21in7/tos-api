const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Buff {
  // 모든 버프 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM Buffs_buffs WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Buffs_buffs WHERE 1=1';
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
      // 총 개수 조회 (슬레이브 DB)
      const countResult = await dbHelpers.readQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      const finalPagination = calculatePagination(page, limit, total);

      // 데이터 조회 (슬레이브 DB)
      const rows = await dbHelpers.readQuery(query, params);

      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-buff')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 버프 조회 - 슬레이브 DB 사용 (ids 컬럼으로 조회)
  static async findById(id) {
    try {
      const query = 'SELECT * FROM Buffs_buffs WHERE ids = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('버프를 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-buff')
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 버프 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM Buffs_buffs WHERE name = ?';
      const rows = await dbHelpers.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-buff')
      };
    } catch (error) {
      throw error;
    }
  }

  // 버프 생성 - 마스터 DB 사용
  static async create(buffData) {
    try {
      const { 
        ids,
        id_name,
        name,
        descriptions,
        type,
        duration,
        effects,
        icon
      } = buffData;
      
      const query = `
        INSERT INTO Buffs_buffs (ids, id_name, name, descriptions, type, duration, effects, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const effectsString = typeof effects === 'object' ? JSON.stringify(effects) : effects;
      
      const result = await dbHelpers.writeQuery(query, [ids, id_name, name, descriptions, type, duration, effectsString, icon]);
      
      return {
        id: result.insertId,
        ...buffData,
        effects: effectsString,
        icon_url: icon ? `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${icon}.png` : null
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 버프 ID입니다.');
      }
      throw error;
    }
  }

  // 버프 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'effects' && typeof updateData[key] === 'object') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
          }
        }
      });

      if (fields.length === 0) {
        throw new Error('업데이트할 데이터가 없습니다.');
      }

      const query = `UPDATE Buffs_buffs SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);

      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('버프를 찾을 수 없습니다.');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // 버프 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Buffs_buffs WHERE id = ?';
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('버프를 찾을 수 없습니다.');
      }
      
      return { message: '버프가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 버프 조회 - 슬레이브 DB 사용
  static async findByType(type) {
    try {
      const query = 'SELECT * FROM Buffs_buffs WHERE type = ?';
      const rows = await dbHelpers.readQuery(query, [type]);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-buff')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 버프 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Buffs_buffs',
        'SELECT type, COUNT(*) as count FROM Buffs_buffs GROUP BY type',
        'SELECT AVG(duration) as avg_duration FROM Buffs_buffs WHERE duration IS NOT NULL'
      ];

      const [totalResult, typeResult, durationResult] = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );

      return {
        total: totalResult[0].total,
        byType: typeResult,
        avgDuration: durationResult[0].avg_duration || 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Buff;
