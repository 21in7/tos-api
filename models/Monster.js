const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Monster {
  // 모든 몬스터 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}, dbHelpers = null) {
    // dbHelpers가 제공되지 않으면 기본 dbHelpers 사용
    const db = dbHelpers || require('../config/database').dbHelpers;
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
      const countResult = await db.readQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      const finalPagination = calculatePagination(page, limit, total);

      // 데이터 조회 (슬레이브 DB)
      const rows = await db.readQuery(query, params);

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

  // ids로 몬스터 조회 - 슬레이브 DB 사용 (드롭 아이템과 스킬 정보 포함)
  static async findById(ids, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE ids = ?';
      const rows = await db.readQuery(query, [ids]);
      
      if (rows.length === 0) {
        throw new Error('몬스터를 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      
      // 드롭 아이템 정보 조회
      const dropsQuery = `
        SELECT 
          md.chance,
          md.qty_min,
          md.qty_max,
          i.id as item_id,
          i.ids as item_ids,
          i.id_name as item_id_name,
          i.name as item_name,
          i.grade as item_grade,
          i.type as item_type
        FROM Monsters_item_monster md
        LEFT JOIN Items_items i ON md.item_id = i.id
        WHERE md.monster_id = ?
        ORDER BY md.chance DESC, i.name
      `;
      const drops = await db.readQuery(dropsQuery, [row.id]);
      
      // 스킬 정보 조회
      const skillsQuery = `
        SELECT 
          sm.ids as skill_ids,
          sm.id_name as skill_id_name,
          sm.name as skill_name,
          sm.element as skill_element,
          sm.cooldown as skill_cooldown,
          sm.sfr as skill_sfr,
          sm.aar as skill_aar,
          sm.hit_count as skill_hit_count
        FROM Monsters_skill_monster_monsters msm
        LEFT JOIN Monsters_skill_monster sm ON msm.skill_monster_id = sm.id
        WHERE msm.monsters_id = ?
        ORDER BY sm.name
      `;
      const skills = await db.readQuery(skillsQuery, [row.id]);
      
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-monster'),
        drops: drops,
        skills: skills
      };
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 몬스터 조회 - 슬레이브 DB 사용 (드롭 아이템과 스킬 정보 포함)
  static async findByName(name, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE name = ?';
      const rows = await db.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      
      // 드롭 아이템 정보 조회
      const dropsQuery = `
        SELECT 
          md.chance,
          md.qty_min,
          md.qty_max,
          i.id as item_id,
          i.ids as item_ids,
          i.id_name as item_id_name,
          i.name as item_name,
          i.grade as item_grade,
          i.type as item_type
        FROM Monsters_item_monster md
        LEFT JOIN Items_items i ON md.item_id = i.id
        WHERE md.monster_id = ?
        ORDER BY md.chance DESC, i.name
      `;
      const drops = await db.readQuery(dropsQuery, [row.id]);
      
      // 스킬 정보 조회
      const skillsQuery = `
        SELECT 
          sm.ids as skill_ids,
          sm.id_name as skill_id_name,
          sm.name as skill_name,
          sm.element as skill_element,
          sm.cooldown as skill_cooldown,
          sm.sfr as skill_sfr,
          sm.aar as skill_aar,
          sm.hit_count as skill_hit_count
        FROM Monsters_skill_monster_monsters msm
        LEFT JOIN Monsters_skill_monster sm ON msm.skill_monster_id = sm.id
        WHERE msm.monsters_id = ?
        ORDER BY sm.name
      `;
      const skills = await db.readQuery(skillsQuery, [row.id]);
      
      return {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-monster'),
        drops: drops,
        skills: skills
      };
    } catch (error) {
      throw error;
    }
  }


  // 레벨 범위별 몬스터 조회 - 슬레이브 DB 사용
  static async findByLevelRange(minLevel, maxLevel, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Monsters_monsters WHERE level >= ? AND level <= ? ORDER BY level, name';
      const rows = await db.readQuery(query, [minLevel, maxLevel]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 몬스터 통계 조회 - 슬레이브 DB 사용
  static async getStats(dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
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
        queries.map(query => db.readQuery(query))
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
