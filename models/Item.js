const { dbHelpers } = require('../config/database');
const { calculatePagination } = require('../utils/response');
const { generateIconUrl } = require('../utils/iconCache');

class Item {
  // 모든 아이템 조회 (페이지네이션) - 슬레이브 DB 사용
  static async findAll(page = 1, limit = 10, filters = {}, dbHelpers = null) {
    // dbHelpers가 제공되지 않으면 기본 dbHelpers 사용
    const db = dbHelpers || require('../config/database').dbHelpers;
    // 기본값으로 장비 정보 포함 (프론트엔드 편의성)
    if (filters.includeEquipment === undefined) {
      filters.includeEquipment = true;
    }
    let query = 'SELECT * FROM Items_items WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Items_items WHERE 1=1';
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

    if (filters.grade) {
      query += ' AND grade = ?';
      countQuery += ' AND grade = ?';
      params.push(filters.grade);
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

      // 아이콘 URL 추가 (캐시 기반)
      const processedRows = rows.map(row => ({
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item')
      }));

      // 장비 정보 포함 여부
      if (filters.includeEquipment) {
        for (let i = 0; i < processedRows.length; i++) {
          const item = processedRows[i];
          if (item.type === 'Equipment' || item.type === 'WEAPON' || item.type === 'ARMOR' || 
              item.type === 'equipment' || item.type === 'weapon' || item.type === 'armor') {
            const equipment = await this.getEquipmentInfo(item.id);
            if (equipment) {
              processedRows[i] = {
                ...item,
                equipment: equipment
              };
            }
          }
        }
      }

      return {
        data: processedRows,
        pagination: finalPagination
      };
    } catch (error) {
      throw error;
    }
  }

  // ID로 아이템 조회 - 슬레이브 DB 사용 (id 또는 ids로 조회, 드롭 몬스터 정보 포함)
  static async findById(id, includeEquipment = true, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      // 먼저 ids로 조회 시도
      let query = 'SELECT * FROM Items_items WHERE ids = ?';
      let params = [id];
      let rows = await db.readQuery(query, params);
      
      // ids로 찾지 못했으면 id로 조회 시도
      if (rows.length === 0) {
        const isNumeric = /^\d+$/.test(id);
        if (isNumeric) {
          query = 'SELECT * FROM Items_items WHERE id = ?';
          params = [parseInt(id)];
          rows = await db.readQuery(query, params);
        }
      }
      
      if (rows.length === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      
      // 드롭 몬스터 정보 조회
      const droppedByQuery = `
        SELECT 
          md.chance,
          md.qty_min,
          md.qty_max,
          m.id as monster_id,
          m.ids as monster_ids,
          m.id_name as monster_id_name,
          m.name as monster_name,
          m.level as monster_level,
          m.rank as monster_rank,
          m.race as monster_race
        FROM Monsters_item_monster md
        LEFT JOIN Monsters_monsters m ON md.monster_id = m.id
        WHERE md.item_id = ?
        ORDER BY md.chance DESC, m.name
      `;
      const droppedBy = await db.readQuery(droppedByQuery, [row.id]);
      
      const result = {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item'),
        dropped_by: droppedBy
      };

      // 장비 정보 포함
      if (includeEquipment && (row.type === 'Equipment' || row.type === 'WEAPON' || row.type === 'ARMOR' || 
          row.type === 'equipment' || row.type === 'weapon' || row.type === 'armor')) {
        const equipment = await this.getEquipmentInfo(row.id);
        if (equipment) {
          result.equipment = equipment;
        }
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 이름으로 아이템 조회 - 슬레이브 DB 사용 (드롭 몬스터 정보 포함)
  static async findByName(name, includeEquipment = true, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Items_items WHERE name = ?';
      const rows = await db.readQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      
      // 드롭 몬스터 정보 조회
      const droppedByQuery = `
        SELECT 
          md.chance,
          md.qty_min,
          md.qty_max,
          m.id as monster_id,
          m.ids as monster_ids,
          m.id_name as monster_id_name,
          m.name as monster_name,
          m.level as monster_level,
          m.rank as monster_rank,
          m.race as monster_race
        FROM Monsters_item_monster md
        LEFT JOIN Monsters_monsters m ON md.monster_id = m.id
        WHERE md.item_id = ?
        ORDER BY md.chance DESC, m.name
      `;
      const droppedBy = await db.readQuery(droppedByQuery, [row.id]);
      
      const result = {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-item'),
        dropped_by: droppedBy
      };

      // 장비 정보 포함
      if (includeEquipment && (row.type === 'Equipment' || row.type === 'WEAPON' || row.type === 'ARMOR' || 
          row.type === 'equipment' || row.type === 'weapon' || row.type === 'armor')) {
        const equipment = await this.getEquipmentInfo(row.id);
        if (equipment) {
          result.equipment = equipment;
        }
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 아이템 생성 - 마스터 DB 사용
  static async create(itemData) {
    try {
      const { 
        ids,
        id_name,
        name,
        descriptions,
        type,
        grade,
        icon,
        cooldown,
        weight,
        tradability
      } = itemData;
      
      const query = `
        INSERT INTO Items_items (ids, id_name, name, descriptions, type, grade, icon, cooldown, weight, tradability)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await dbHelpers.writeQuery(query, [ids, id_name, name, descriptions, type, grade, icon, cooldown, weight, tradability]);
      
      return {
        id: result.insertId,
        ...itemData,
        icon_url: icon ? `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${icon}.png` : null
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 존재하는 아이템 ID입니다.');
      }
      throw error;
    }
  }

  // 아이템 업데이트 - 마스터 DB 사용
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'stats' && typeof updateData[key] === 'object') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(updateData[key]));
          } else if (key === 'type') {
            fields.push('item_type_id = (SELECT id FROM Items_item_type WHERE name = ?)');
            values.push(updateData[key]);
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
      
      const query = `UPDATE Items_items SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await dbHelpers.writeQuery(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      throw error;
    }
  }

  // 아이템 삭제 - 마스터 DB 사용
  static async delete(id) {
    try {
      const query = 'DELETE FROM Items_items WHERE id = ?';
      
      const result = await dbHelpers.writeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('아이템을 찾을 수 없습니다.');
      }
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // 타입별 아이템 조회 - 슬레이브 DB 사용
  static async findByType(type, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = `
        SELECT i.*, it.name as type_name 
        FROM Items_items i 
        JOIN Items_item_type it ON i.item_type_id = it.id 
        WHERE it.name = ? 
        ORDER BY i.level, i.name
      `;
      const rows = await db.readQuery(query, [type]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 희귀도별 아이템 조회 - 슬레이브 DB 사용
  static async findByRarity(rarity, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Items_items WHERE rarity = ? ORDER BY level DESC, name';
      const rows = await db.readQuery(query, [rarity]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 레벨 범위별 아이템 조회 - 슬레이브 DB 사용
  static async findByLevelRange(minLevel, maxLevel, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const query = 'SELECT * FROM Items_items WHERE level >= ? AND level <= ? ORDER BY level, name';
      const rows = await db.readQuery(query, [minLevel, maxLevel]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // 장비 정보 조회 - 슬레이브 DB 사용
  static async getEquipmentInfo(itemId, dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      // 장비 기본 정보 조회
      const equipmentQuery = 'SELECT * FROM Items_equipments WHERE item_id = ?';
      const equipmentRows = await db.readQuery(equipmentQuery, [itemId]);
      
      if (equipmentRows.length === 0) {
        return null;
      }
      
      const equipment = equipmentRows[0];
      
      // 장비 보너스 정보 조회
      const bonusQuery = 'SELECT * FROM Items_equipment_bonus WHERE equipment_id = ?';
      const bonusRows = await db.readQuery(bonusQuery, [itemId]);
      
      return {
        ...equipment,
        bonuses: bonusRows
      };
    } catch (error) {
      console.error('장비 정보 조회 오류:', error);
      return null;
    }
  }

  // 아이템 통계 조회 - 슬레이브 DB 사용
  static async getStats(dbHelpers = null) {
    const db = dbHelpers || require('../config/database').dbHelpers;
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM Items_items',
        'SELECT type, COUNT(*) as count FROM Items_items GROUP BY type',
        'SELECT grade, COUNT(*) as count FROM Items_items GROUP BY grade',
        'SELECT COUNT(*) as equipment_count FROM Items_equipments',
        'SELECT COUNT(*) as bonus_count FROM Items_equipment_bonus'
      ];
      
      const results = await Promise.all(
        queries.map(query => db.readQuery(query))
      );
      
      return {
        total: results[0][0].total,
        byType: results[1],
        byGrade: results[2],
        equipmentCount: results[3][0].equipment_count,
        bonusCount: results[4][0].bonus_count
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Item;
