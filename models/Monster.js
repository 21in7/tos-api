const { db } = require('../config/database');
const { calculatePagination } = require('../utils/response');

class Monster {
  // 모든 몬스터 조회 (페이지네이션)
  static async findAll(page = 1, limit = 10, filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM monsters WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM monsters WHERE 1=1';
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
        query += ' AND (name LIKE ? OR description LIKE ?)';
        countQuery += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // 정렬
      query += ' ORDER BY level, name';

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

  // ID로 몬스터 조회
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM monsters WHERE id = ?';
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('몬스터를 찾을 수 없습니다.'));
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 이름으로 몬스터 조회
  static async findByName(name) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM monsters WHERE name = ?';
      
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 몬스터 생성
  static async create(monsterData) {
    return new Promise((resolve, reject) => {
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
        INSERT INTO monsters (name, description, level, hp, attack, defense, speed, exp_reward, loot_table)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const lootTableString = typeof loot_table === 'object' ? JSON.stringify(loot_table) : loot_table;
      
      db.run(query, [name, description, level, hp, attack, defense, speed, exp_reward, lootTableString], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('이미 존재하는 몬스터 이름입니다.'));
            return;
          }
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          ...monsterData,
          loot_table: lootTableString
        });
      });
    });
  }

  // 몬스터 업데이트
  static async update(id, updateData) {
    return new Promise((resolve, reject) => {
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
        reject(new Error('업데이트할 데이터가 없습니다.'));
        return;
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `UPDATE monsters SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('몬스터를 찾을 수 없습니다.'));
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

  // 몬스터 삭제
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM monsters WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('몬스터를 찾을 수 없습니다.'));
          return;
        }
        
        resolve({ id });
      });
    });
  }

  // 레벨 범위별 몬스터 조회
  static async findByLevelRange(minLevel, maxLevel) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM monsters WHERE level >= ? AND level <= ? ORDER BY level, name';
      
      db.all(query, [minLevel, maxLevel], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // 몬스터 통계 조회
  static async getStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total FROM monsters',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM monsters',
        'SELECT AVG(hp) as avg_hp, MIN(hp) as min_hp, MAX(hp) as max_hp FROM monsters',
        'SELECT AVG(attack) as avg_attack, MIN(attack) as min_attack, MAX(attack) as max_attack FROM monsters',
        'SELECT AVG(exp_reward) as avg_exp, MIN(exp_reward) as min_exp, MAX(exp_reward) as max_exp FROM monsters'
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
          levelStats: results[1][0],
          hpStats: results[2][0],
          attackStats: results[3][0],
          expStats: results[4][0]
        });
      }).catch(reject);
    });
  }
}

module.exports = Monster;
