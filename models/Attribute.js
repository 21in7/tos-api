const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');

class Attribute {
  // 모든 속성 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM attributes WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM attributes WHERE 1=1';
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
    query += ' ORDER BY created_at DESC';

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

      return {
        data: rows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 속성 조회 - 슬레이브 DB 사용
  static async findById(id) {
    try {
      const query = 'SELECT * FROM attributes WHERE id = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 속성 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM attributes WHERE name = ?';
      const rows = await dbHelpers.readQuery(query, [name]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // 속성 생성 - 마스터 DB 사용
  static async create(attributeData) {
    try {
      const { name, description, type, base_value = 0, max_value = 100 } = attributeData;
      
      const query = `
        INSERT INTO attributes (name, description, type, base_value, max_value)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const result = await dbHelpers.writeQuery(query, [name, description, type, base_value, max_value]);
      
      return {
        id: result.insertId,
        ...attributeData
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 속성 이름입니다.');
      }
      throw error;
    }
  }

  // 속성 업데이트 - 마스터 DB 사용
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
      
      fields.push('updated_at = NOW()');
      values.push(id);
      
      const query = `UPDATE attributes SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // 속성 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM attributes WHERE id = ?';
      
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 속성 조회 - 슬레이브 DB 사용
  static async findByType(type) {
    try {
      const query = 'SELECT * FROM attributes WHERE type = ? ORDER BY name';
      const rows = await dbHelpers.readQuery(query, [type]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 속성 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM attributes',
        'SELECT type, COUNT(*) as count FROM attributes GROUP BY type',
        'SELECT AVG(base_value) as avg_base_value, MAX(max_value) as max_max_value FROM attributes'
      ];
      
      const results = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        byType: results[1],
        averages: results[2][0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Attribute;
