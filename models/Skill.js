const { db } = require('../config/database');
const { calculatePagination } = require('../utils/response');

class Skill {
  // 모든 스킬 조회 (페이지네이션)
  static async findAll(page = 1, limit = 10, filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM skills WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM skills WHERE 1=1';
      const params = [];

      // 필터 적용
      if (filters.type) {
        query += ' AND type = ?';
        countQuery += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        countQuery += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // 정렬
      query += ' ORDER BY type, level, name';

      // 페이지네이션
      const pagination = calculatePagination(page, limit, 0);
      query += ' LIMIT ? OFFSET ?';
      params.push(pagination.limit, pagination.offset);

      // 총 개수 조회
      db.get(countQuery, params.slice(0, -2), (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countResult.total;
        const finalPagination = calculatePagination(page, limit, total);

        // 데이터 조회
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            data: rows,
            pagination: finalPagination
          });
        });
      });
    });
  }

  // ID로 스킬 조회
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM skills WHERE id = ?';
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('스킬을 찾을 수 없습니다.'));
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 이름으로 스킬 조회
  static async findByName(name) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM skills WHERE name = ?';
      
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 스킬 생성
  static async create(skillData) {
    return new Promise((resolve, reject) => {
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
        INSERT INTO skills (name, description, type, level, cooldown, mana_cost, damage, effects)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const effectsString = typeof effects === 'object' ? JSON.stringify(effects) : effects;
      
      db.run(query, [name, description, type, level, cooldown, mana_cost, damage, effectsString], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('이미 존재하는 스킬 이름입니다.'));
            return;
          }
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          ...skillData,
          effects: effectsString
        });
      });
    });
  }

  // 스킬 업데이트
  static async update(id, updateData) {
    return new Promise((resolve, reject) => {
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
        reject(new Error('업데이트할 데이터가 없습니다.'));
        return;
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `UPDATE skills SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('스킬을 찾을 수 없습니다.'));
          return;
        }
        
        resolve({
          id,
          ...updateData,
          updated_at: new Date().toISOString()
        });
      });
    });
  }

  // 스킬 삭제
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM skills WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('스킬을 찾을 수 없습니다.'));
          return;
        }
        
        resolve({ id });
      });
    });
  }

  // 타입별 스킬 조회
  static async findByType(type) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM skills WHERE type = ? ORDER BY level, name';
      
      db.all(query, [type], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // 스킬 통계 조회
  static async getStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total FROM skills',
        'SELECT type, COUNT(*) as count FROM skills GROUP BY type',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM skills',
        'SELECT AVG(mana_cost) as avg_mana, MIN(mana_cost) as min_mana, MAX(mana_cost) as max_mana FROM skills',
        'SELECT AVG(damage) as avg_damage, MIN(damage) as min_damage, MAX(damage) as max_damage FROM skills'
      ];
      
      Promise.all(queries.map(query => 
        new Promise((resolveQuery, rejectQuery) => {
          db.all(query, [], (err, rows) => {
            if (err) {
              rejectQuery(err);
              return;
            }
            resolveQuery(rows);
          });
        })
      )).then(results => {
        resolve({
          total: results[0][0].total,
          byType: results[1],
          levelStats: results[2][0],
          manaStats: results[3][0],
          damageStats: results[4][0]
        });
      }).catch(reject);
    });
  }
}

module.exports = Skill;
