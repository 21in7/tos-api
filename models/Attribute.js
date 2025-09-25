const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Attribute {
  // 모든 속성 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM Attributes_attributes WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Attributes_attributes WHERE 1=1';
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
      query += ' AND (name LIKE ? OR descriptions LIKE ?)';
      countQuery += ' AND (name LIKE ? OR descriptions LIKE ?)';
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
        icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ids로 속성 조회 - 슬레이브 DB 사용
  static async findById(ids) {
    try {
      const query = 'SELECT * FROM Attributes_attributes WHERE ids = ?';
      const rows = await dbHelpers.readQuery(query, [ids]);
      
      if (rows.length === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
      };
    } catch (error) {
      throw error;
    }
  }

  // ids로 속성 조회 (관련 jobs와 skills 포함) - 슬레이브 DB 사용
  static async findByIdWithRelations(ids) {
    try {
      const query = 'SELECT * FROM Attributes_attributes WHERE ids = ?';
      const rows = await dbHelpers.readQuery(query, [ids]);
      
      if (rows.length === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      const attribute = rows[0];
      
      // 관련 jobs 조회
      const jobsQuery = `
        SELECT j.id, j.ids, j.id_name, j.name, j.descriptions, j.job_tree, j.icon
        FROM Attributes_attributes_job aaj
        JOIN Jobs_jobs j ON aaj.jobs_id = j.id
        WHERE aaj.attributes_id = ?
      `;
      const jobs = await dbHelpers.readQuery(jobsQuery, [attribute.id]);
      
      // 관련 skills 조회
      const skillsQuery = `
        SELECT s.id, s.ids, s.id_name, s.name, s.descriptions, s.job_id, s.icon
        FROM Attributes_attributes_skill aas
        JOIN Skills_skills s ON aas.skills_id = s.id
        WHERE aas.attributes_id = ?
      `;
      const skills = await dbHelpers.readQuery(skillsQuery, [attribute.id]);
      
      // jobs와 skills에 아이콘 URL 추가
      const processedJobs = jobs.map(job => ({
        ...job,
        icon_url: generateIconUrl(job.icon, 'icons', 'default-job')
      }));
      
      const processedSkills = skills.map(skill => ({
        ...skill,
        icon_url: generateIconUrl(skill.icon, 'icons', 'default-skill')
      }));
      
      return {
        ...attribute,
        icon_url: generateIconUrl(attribute.icon, 'icons', 'default-attribute'),
        related_jobs: processedJobs,
        related_skills: processedSkills
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 속성 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM Attributes_attributes WHERE name = ?';
      const rows = await dbHelpers.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-attribute')
      };
    } catch (error) {
      throw error;
    }
  }

  // 속성 생성 - 마스터 DB 사용
  static async create(attributeData) {
    try {
      const { name, description, type, base_value = 0, max_value = 100 } = attributeData;
      
      const query = `
        INSERT INTO Attributes_attributes (name, description, type, base_value, max_value)
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
      
      values.push(id);
      
      const query = `UPDATE Attributes_attributes SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('속성을 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      throw error;
    }
  }

  // 속성 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Attributes_attributes WHERE id = ?';
      
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
      const query = 'SELECT * FROM Attributes_attributes WHERE type = ? ORDER BY name';
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
        'SELECT COUNT(*) as total FROM Attributes_attributes',
        'SELECT type, COUNT(*) as count FROM Attributes_attributes GROUP BY type',
        'SELECT AVG(base_value) as avg_base_value, MAX(max_value) as max_max_value FROM Attributes_attributes'
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
