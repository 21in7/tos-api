const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Monster {
  // 모든 몬스터 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}) {
    let query = 'SELECT * FROM Monsters_monsters WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Monsters_monsters WHERE 1=1';
    const params = [];

    // 기본 필터: 빈 데이터 제외
    query += ' AND name IS NOT NULL AND name != ""';
    query += ' AND ids IS NOT NULL AND ids != ""';
    query += ' AND level > 0';
    query += ' AND name NOT LIKE "%임시%"';
    query += ' AND name NOT LIKE "%boss_%"';
    query += ' AND name NOT LIKE "%DynamicObject%"';
    query += ' AND name NOT LIKE "%Symbol_%"';
    query += ' AND name NOT LIKE "%( 임시)%"';
    query += ' AND name NOT LIKE "%Blizzard%"';
    query += ' AND rank NOT IN ("Material", "MISC")';
    countQuery += ' AND name IS NOT NULL AND name != ""';
    countQuery += ' AND ids IS NOT NULL AND ids != ""';
    countQuery += ' AND level > 0';
    countQuery += ' AND name NOT LIKE "%임시%"';
    countQuery += ' AND name NOT LIKE "%boss_%"';
    countQuery += ' AND name NOT LIKE "%DynamicObject%"';
    countQuery += ' AND name NOT LIKE "%Symbol_%"';
    countQuery += ' AND name NOT LIKE "%( 임시)%"';
    countQuery += ' AND name NOT LIKE "%Blizzard%"';
    countQuery += ' AND rank NOT IN ("Material", "MISC")';

    // 필터 적용
    if (filters.ids) {
      query += ' AND ids = ?';
      countQuery += ' AND ids = ?';
      params.push(filters.ids);
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

    if (filters.race) {
      query += ' AND race = ?';
      countQuery += ' AND race = ?';
      params.push(filters.race);
    }

    if (filters.rank) {
      query += ' AND rank = ?';
      countQuery += ' AND rank = ?';
      params.push(filters.rank);
    }

    if (filters.element) {
      query += ' AND element = ?';
      countQuery += ' AND element = ?';
      params.push(filters.element);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR id_name LIKE ?)';
      countQuery += ' AND (name LIKE ? OR id_name LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // 추가 필터: 유효한 데이터만 조회
    if (filters.validOnly !== false) {
      query += ' AND hp > 0';
      countQuery += ' AND hp > 0';
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

  // ids로 몬스터 조회 - 슬레이브 DB 사용
  static async findById(ids) {
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE ids = ?';
      const rows = await dbHelpers.readQuery(query, [ids]);
      
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
        'SELECT AVG(patk_max) as avg_patk, MIN(patk_max) as min_patk, MAX(patk_max) as max_patk FROM Monsters_monsters',
        'SELECT AVG(matk_max) as avg_matk, MIN(matk_max) as min_matk, MAX(matk_max) as max_matk FROM Monsters_monsters',
        'SELECT AVG(exp) as avg_exp, MIN(exp) as min_exp, MAX(exp) as max_exp FROM Monsters_monsters',
        'SELECT race, COUNT(*) as count FROM Monsters_monsters WHERE race IS NOT NULL GROUP BY race',
        'SELECT rank, COUNT(*) as count FROM Monsters_monsters WHERE rank IS NOT NULL GROUP BY rank',
        'SELECT element, COUNT(*) as count FROM Monsters_monsters WHERE element IS NOT NULL GROUP BY element'
      ];
      
      const results = await Promise.all(
        queries.map(query => dbHelpers.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        levelStats: results[1][0],
        hpStats: results[2][0],
        patkStats: results[3][0],
        matkStats: results[4][0],
        expStats: results[5][0],
        raceDistribution: results[6],
        rankDistribution: results[7],
        elementDistribution: results[8]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Monster;
