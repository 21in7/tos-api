const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Monster {
  // 모든 몬스터 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM Monsters_monsters WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Monsters_monsters WHERE 1=1';
    const params = [];

    // 필터 적용
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

    if (filters.search) {
      query += ' AND (name LIKE ? OR id_name LIKE ?)';
      countQuery += ' AND (name LIKE ? OR id_name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // 정렬
    query += ' ORDER BY level, name';

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
        icon_url: generateIconUrl(row.icon, 'icon', 'default-monster')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 몬스터 조회 - 슬레이브 DB 사용
  static async findById(id) {
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE id = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
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

  // 이름으로 몬스터 조회 - 슬레이브 DB 사용
  static async findByName(name) {
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

  // 몬스터 생성 - 마스터 DB 사용
  static async create(monsterData) {
    try {
      const { 
        name, 
        description, 
        level = 1, 
        hp = 100, 
        attack = 10, 
        defense = 5, 
        speed = 10, 
        exp_reward = 10, 
        loot_table = '{}' 
      } = monsterData;
      
      const query = `
        INSERT INTO Monsters_monsters (name, description, level, hp, attack, defense, speed, exp_reward, loot_table)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const lootTableString = typeof loot_table === 'object' ? JSON.stringify(loot_table) : loot_table;
      
      const result = await dbHelpers.writeQuery(query, [name, description, level, hp, attack, defense, speed, exp_reward, lootTableString]);
      
      return {
        id: result.insertId,
        ...monsterData,
        loot_table: lootTableString
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 몬스터 이름입니다.');
      }
      throw error;
    }
  }

  // 몬스터 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'loot_table' && typeof updateData[key] === 'object') {
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
      
      const query = `UPDATE Monsters_monsters SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('몬스터를 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      throw error;
    }
  }

  // 몬스터 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Monsters_monsters WHERE id = ?';
      
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('몬스터를 찾을 수 없습니다.');
      }
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // 레벨 범위별 몬스터 조회 - 슬레이브 DB 사용
  static async findByLevelRange(minLevel, maxLevel) {
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE level >= ? AND level <= ? ORDER BY level, name';
      const rows = await dbHelpers.readQuery(query, [minLevel, maxLevel]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 몬스터 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Monsters_monsters',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM Monsters_monsters',
        'SELECT AVG(hp) as avg_hp, MIN(hp) as min_hp, MAX(hp) as max_hp FROM Monsters_monsters',
        'SELECT AVG(attack) as avg_attack, MIN(attack) as min_attack, MAX(attack) as max_attack FROM Monsters_monsters',
        'SELECT AVG(exp_reward) as avg_exp, MIN(exp_reward) as min_exp, MAX(exp_reward) as max_exp FROM Monsters_monsters'
      ];
      
      const results = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        levelStats: results[1][0],
        hpStats: results[2][0],
        attackStats: results[3][0],
        expStats: results[4][0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Monster;
