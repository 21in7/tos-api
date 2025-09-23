const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Job {
  // 모든 직업 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM Jobs_jobs WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Jobs_jobs WHERE 1=1';
    const params = [];

    // 필터 적용
    if (filters.ids) {
      query += ' AND ids = ?';
      countQuery += ' AND ids = ?';
      params.push(filters.ids);
    }

    if (filters.job_tree) {
      query += ' AND job_tree = ?';
      countQuery += ' AND job_tree = ?';
      params.push(filters.job_tree);
    }

    if (filters.is_starter !== undefined) {
      query += ' AND is_starter = ?';
      countQuery += ' AND is_starter = ?';
      params.push(filters.is_starter);
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
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      }));

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 직업 조회 - 슬레이브 DB 사용 (ids 컬럼으로 조회)
  static async findById(id) {
    try {
      const query = 'SELECT * FROM Jobs_jobs WHERE ids = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('직업을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 직업 조회 - 슬레이브 DB 사용
  static async findByName(name) {
    try {
      const query = 'SELECT * FROM Jobs_jobs WHERE name = ?';
      const rows = await dbHelpers.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      };
    } catch (error) {
      throw error;
    }
  }

  // 직업 생성 - 마스터 DB 사용
  static async create(jobData) {
    try {
      const { 
        ids,
        id_name,
        icon,
        job_tree,
        name,
        is_starter,
        descriptions
      } = jobData;
      
      const query = `
        INSERT INTO Jobs_jobs (ids, id_name, icon, job_tree, name, is_starter, descriptions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await dbHelpers.writeQuery(query, [ids, id_name, icon, job_tree, name, is_starter, descriptions]);
      
      return {
        id: result.insertId,
        ...jobData,
        icon_url: icon ? `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${icon}.png` : null
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 직업 ID입니다.');
      }
      throw error;
    }
  }

  // 직업 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if ((key === 'stats' || key === 'skills') && typeof updateData[key] === 'object') {
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

      const query = `UPDATE Jobs_jobs SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);

      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('직업을 찾을 수 없습니다.');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // 직업 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Jobs_jobs WHERE id = ?';
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('직업을 찾을 수 없습니다.');
      }
      
      return { message: '직업이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw error;
    }
  }

  // 직업 트리별 조회 - 슬레이브 DB 사용
  static async findByJobTree(jobTree) {
    try {
      const query = 'SELECT * FROM Jobs_jobs WHERE job_tree = ?';
      const rows = await dbHelpers.readQuery(query, [jobTree]);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icon', 'default-job')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 스타터 직업 조회 - 슬레이브 DB 사용
  static async findStarterJobs() {
    try {
      const query = 'SELECT * FROM Jobs_jobs WHERE is_starter = 1';
      const rows = await dbHelpers.readQuery(query);
      
      // 아이콘 URL 추가
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      }));
      
      return processedRows;
    } catch (error) {
      throw error;
    }
  }

  // 직업 통계 조회 - 슬레이브 DB 사용
  static async getStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Jobs_jobs',
        'SELECT job_tree, COUNT(*) as count FROM Jobs_jobs GROUP BY job_tree',
        'SELECT COUNT(*) as starter_count FROM Jobs_jobs WHERE is_starter = 1',
        'SELECT COUNT(*) as non_starter_count FROM Jobs_jobs WHERE is_starter = 0'
      ];

      const [totalResult, jobTreeResult, starterResult, nonStarterResult] = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );

      return {
        total: totalResult[0].total,
        byJobTree: jobTreeResult,
        starterCount: starterResult[0].starter_count,
        nonStarterCount: nonStarterResult[0].non_starter_count
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Job;
