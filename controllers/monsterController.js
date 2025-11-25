const Monster = require('../models/Monster');
const { successResponse, errorResponse, paginatedResponse, createdResponse, updatedResponse, deletedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDbHelpers } = require('../config/database');

class MonsterController {
  // 모든 몬스터 조회
  getAllMonsters = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
      maxLevel: req.query.maxLevel ? parseInt(req.query.maxLevel) : undefined,
      race: req.query.race,
      rank: req.query.rank,
      element: req.query.element,
      search: req.query.search,
      validOnly: req.query.validOnly !== 'false' // 기본값: true (유효한 데이터만)
    };

    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const result = await Monster.findAll(page, limit, filters, dbHelpers);
    
    paginatedResponse(res, result.data, result.pagination, '몬스터 목록을 조회했습니다.');
  });

  // ids로 몬스터 조회
  getMonsterById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const monster = await Monster.findById(id, dbHelpers);
    successResponse(res, monster, '몬스터를 조회했습니다.');
  });

  // 이름으로 몬스터 조회
  getMonsterByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const monster = await Monster.findByName(name, dbHelpers);
    if (!monster) {
      return errorResponse(res, '몬스터를 찾을 수 없습니다.', 404);
    }
    
    successResponse(res, monster, '몬스터를 조회했습니다.');
  });

  // 레벨 범위별 몬스터 조회
  getMonstersByLevelRange = asyncHandler(async (req, res) => {
    const { minLevel, maxLevel } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const monsters = await Monster.findByLevelRange(parseInt(minLevel), parseInt(maxLevel), dbHelpers);
    successResponse(res, monsters, `레벨 ${minLevel}-${maxLevel} 몬스터들을 조회했습니다.`);
  });


  // 몬스터 통계 조회
  getMonsterStats = asyncHandler(async (req, res) => {
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const stats = await Monster.getStats(dbHelpers);
    successResponse(res, stats, '몬스터 통계를 조회했습니다.');
  });

  // 몬스터 검색
  searchMonsters = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return errorResponse(res, '검색어를 입력해주세요.', 400);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { search: searchTerm };
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const result = await Monster.findAll(page, limit, filters, dbHelpers);
    paginatedResponse(res, result.data, result.pagination, `"${searchTerm}" 검색 결과입니다.`);
  });
}

module.exports = new MonsterController();
