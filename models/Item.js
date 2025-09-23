const { db } = require('../config/database');
const { calculatePagination } = require('../utils/response');

class Item {
  // 모든 아이템 조회 (페이지네이션)
  static async findAll(page = 1, limit = 10, filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM items WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM items WHERE 1=1';
      const params = [];

      // 필터 적용
      if (filters.type) {
        query += ' AND type = ?';
        countQuery += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.rarity) {
        query += ' AND rarity = ?';
        countQuery += ' AND rarity = ?';
        params.push(filters.rarity);
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

      if (filters.search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        countQuery += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // 정렬
      query += ' ORDER BY created_at DESC';

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

  // ID로 아이템 조회
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM items WHERE id = ?';
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('아이템을 찾을 수 없습니다.'));
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 이름으로 아이템 조회
  static async findByName(name) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM items WHERE name = ?';
      
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row);
      });
    });
  }

  // 아이템 생성
  static async create(itemData) {
    return new Promise((resolve, reject) => {
      const { 
        name, 
        description, 
        type, 
        rarity = 'common', 
        level = 1, 
        stats = '{}', 
        price = 0, 
        stackable = true 
      } = itemData;
      
      const query = `
        INSERT INTO items (name, description, type, rarity, level, stats, price, stackable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const statsString = typeof stats === 'object' ? JSON.stringify(stats) : stats;
      
      db.run(query, [name, description, type, rarity, level, statsString, price, stackable], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('이미 존재하는 아이템 이름입니다.'));
            return;
          }
          reject(err);
          return;
        }
        
        resolve({
          id: this.lastID,
          ...itemData,
          stats: statsString
        });
      });
    });
  }

  // 아이템 업데이트
  static async update(id, updateData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'stats' && typeof updateData[key] === 'object') {
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
      
      const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('아이템을 찾을 수 없습니다.'));
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

  // 아이템 삭제
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM items WHERE id = ?';
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('아이템을 찾을 수 없습니다.'));
          return;
        }
        
        resolve({ id });
      });
    });
  }

  // 타입별 아이템 조회
  static async findByType(type) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM items WHERE type = ? ORDER BY level, name';
      
      db.all(query, [type], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // 희귀도별 아이템 조회
  static async findByRarity(rarity) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM items WHERE rarity = ? ORDER BY level DESC, name';
      
      db.all(query, [rarity], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // 레벨 범위별 아이템 조회
  static async findByLevelRange(minLevel, maxLevel) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM items WHERE level >= ? AND level <= ? ORDER BY level, name';
      
      db.all(query, [minLevel, maxLevel], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // 아이템 통계 조회
  static async getStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total FROM items',
        'SELECT type, COUNT(*) as count FROM items GROUP BY type',
        'SELECT rarity, COUNT(*) as count FROM items GROUP BY rarity',
        'SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM items',
        'SELECT AVG(level) as avg_level, MIN(level) as min_level, MAX(level) as max_level FROM items'
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
          byRarity: results[2],
          priceStats: results[3][0],
          levelStats: results[4][0]
        });
      }).catch(reject);
    });
  }
}

module.exports = Item;
