const { dbHelpers } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class DashboardController {
  // 대시보드 전체 통계 조회 - 슬레이브 DB 사용
  getDashboardStats = asyncHandler(async (req, res) => {
    const queries = [
      'SELECT COUNT(*) as total FROM Attributes_attributes',
      'SELECT COUNT(*) as total FROM Buffs_buffs',
      'SELECT COUNT(*) as total FROM Items_items',
      'SELECT COUNT(*) as total FROM Monsters_monsters',
      'SELECT COUNT(*) as total FROM Skills_skills',
      'SELECT COUNT(*) as total FROM Jobs_jobs',
      'SELECT COUNT(*) as total FROM Maps_maps',
      'SELECT COUNT(*) as total FROM Other_achievements'
    ];

    const results = await Promise.all(
      queries.map(query => dbHelpers.readQuery(query))
    );

    const stats = {
      attributes: results[0][0].total,
      buffs: results[1][0].total,
      items: results[2][0].total,
      monsters: results[3][0].total,
      skills: results[4][0].total,
      jobs: results[5][0].total,
      maps: results[6][0].total,
      achievements: results[7][0].total,
      total: results.reduce((sum, result) => sum + result[0].total, 0)
    };

    successResponse(res, stats, '대시보드 통계를 조회했습니다.');
  });

  // 최근 추가된 데이터 조회 - 슬레이브 DB 사용
  getRecentData = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    
    const queries = [
      `SELECT 'attribute' as type, id, name, created_at FROM Attributes_attributes ORDER BY id DESC LIMIT ${limit}`,
      `SELECT 'item' as type, id, name, created_at FROM Items_items ORDER BY id DESC LIMIT ${limit}`,
      `SELECT 'monster' as type, id, name, created_at FROM Monsters_monsters ORDER BY id DESC LIMIT ${limit}`,
      `SELECT 'skill' as type, id, name, created_at FROM Skills_skills ORDER BY id DESC LIMIT ${limit}`
    ];

    const results = await Promise.all(
      queries.map(query => dbHelpers.readQuery(query))
    );

    const recentData = results.flat().sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, limit * 2);

    successResponse(res, recentData, '최근 추가된 데이터를 조회했습니다.');
  });

  // 시스템 상태 조회
  getSystemStatus = asyncHandler(async (req, res) => {
    const status = {
      database: 'connected',
      api: 'running',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    successResponse(res, status, '시스템 상태를 조회했습니다.');
  });

  // 데이터베이스 테이블 정보 조회 - 슬레이브 DB 사용
  getTableInfo = asyncHandler(async (req, res) => {
    const tables = [
      'Attributes_attributes', 'Buffs_buffs', 'Items_items', 'Monsters_monsters', 
      'Skills_skills', 'Jobs_jobs', 'Maps_maps', 'Other_achievements'
    ];

    const tableInfo = await Promise.all(
      tables.map(async table => {
        try {
          const result = await dbHelpers.readQuery(`SELECT COUNT(*) as count FROM ${table}`);
          return { table, count: result[0].count };
        } catch (error) {
          return { table, count: 0, error: error.message };
        }
      })
    );

    successResponse(res, tableInfo, '테이블 정보를 조회했습니다.');
  });
}

module.exports = new DashboardController();
