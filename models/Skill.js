const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Skill {
  // 모든 스킬 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}, dbHelpers = null) {
    // dbHelpers가 제공되지 않으면 기본 dbHelpers 사용
    const db = dbHelpers || require('../config/database').dbHelpers;
    let query = 'SELECT * FROM Skills_skills WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Skills_skills WHERE 1=1';
    const params = [];

    // 필터 적용
    if (filters.ids) {
      query += ' AND ids = ?';
      countQuery += ' AND ids = ?';
      params.push(filters.ids);
    }

    if (filters.job_id) {
      query += ' AND job_id = ?';
      countQuery += ' AND job_id = ?';
      params.push(filters.job_id);
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
      const countResult = await db.readQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      const finalPagination = calculatePagination(page, limit, total);

      // 데이터 조회 (슬레이브 DB)
      const rows = await db.readQuery(query, params);

      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-skill')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 스킬 조회 - 슬레이브 DB 사용
  static async findById(id, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Skills_skills WHERE id = ?';
      const rows = await db.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('스킬을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-skill')
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 스킬 조회 - 슬레이브 DB 사용
  static async findByName(name, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Skills_skills WHERE name = ?';
      const rows = await db.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-skill')
      };
    } catch (error) {
      throw error;
    }
  }

  // 스킬 생성 - 마스터 DB 사용
  static async create(skillData) {
    try {
      const { 
        name, 
        description, 
        type, 
        level = 1, 
        cooldown = 0, 
        mana_cost = 0, 
        damage = 0, 
        effects = '{}'
      } = skillData;
      
      const query = `
        INSERT INTO Skills_skills (name, description, type, level, cooldown, mana_cost, damage, effects)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const effectsString = typeof effects === 'object' ? JSON.stringify(effects) : effects;
      
      const result = await dbHelpers.writeQuery(query, [name, description, type, level, cooldown, mana_cost, damage, effectsString]);
      
      return {
        id: result.insertId,
        ...skillData,
        effects: effectsString
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 스킬 이름입니다.');
      }
      throw error;
    }
  }

  // 스킬 업데이트 - 마스터 DB 사용
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
      
      values.push(id);
      
      const query = `UPDATE Skills_skills SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('스킬을 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      throw error;
    }
  }

  // 스킬 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Skills_skills WHERE id = ?';
      
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('스킬을 찾을 수 없습니다.');
      }
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 스킬 조회 - 슬레이브 DB 사용
  static async findByType(type, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Skills_skills WHERE type = ? ORDER BY level, name';
      const rows = await db.readQuery(query, [type]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 스킬 통계 조회 - 슬레이브 DB 사용
  static async getStats(dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Skills_skills',
        'SELECT type, COUNT(*) as count FROM Skills_skills GROUP BY type',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM Skills_skills',
        'SELECT AVG(mana_cost) as avg_mana, MIN(mana_cost) as min_mana, MAX(mana_cost) as max_mana FROM Skills_skills',
        'SELECT AVG(damage) as avg_damage, MIN(damage) as min_damage, MAX(damage) as max_damage FROM Skills_skills'
      ];
      
      const results = await Promise.all(
        queries.map(query => db.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        byType: results[1],
        levelStats: results[2][0],
        manaStats: results[3][0],
        damageStats: results[4][0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Skill;
