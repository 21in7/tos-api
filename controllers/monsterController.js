const Monster = require('../models/Monster');
const { successResponse, errorResponse, paginatedResponse, createdResponse, updatedResponse, deletedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class MonsterController {
  // 모든 몬스터 조회
  getAllMonsters = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
      maxLevel: req.query.maxLevel ? parseInt(req.query.maxLevel) : undefined,
      search: req.query.search
    };

    const result = await Monster.findAll(page, limit, filters);
    
    paginatedResponse(res, result.data, result.pagination, '몬스터 목록을 조회했습니다.');
  });

  // ID로 몬스터 조회
  getMonsterById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const monster = await Monster.findById(id);
    successResponse(res, monster, '몬스터를 조회했습니다.');
  });

  // 이름으로 몬스터 조회
  getMonsterByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const monster = await Monster.findByName(name);
    if (!monster) {
      return errorResponse(res, '몬스터를 찾을 수 없습니다.', 404);
    }
    
    successResponse(res, monster, '몬스터를 조회했습니다.');
  });

  // 레벨 범위별 몬스터 조회
  getMonstersByLevelRange = asyncHandler(async (req, res) => {
    const { minLevel, maxLevel } = req.params;
    
    const monsters = await Monster.findByLevelRange(parseInt(minLevel), parseInt(maxLevel));
    successResponse(res, monsters, `레벨 ${minLevel}-${maxLevel} 몬스터들을 조회했습니다.`);
  });

  // 새 몬스터 생성
  createMonster = asyncHandler(async (req, res) => {
    const monsterData = req.body;
    
    const newMonster = await Monster.create(monsterData);
    createdResponse(res, newMonster, '몬스터가 생성되었습니다.');
  });

  // 몬스터 업데이트
  updateMonster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedMonster = await Monster.update(id, updateData);
    updatedResponse(res, updatedMonster, '몬스터가 업데이트되었습니다.');
  });

  // 몬스터 삭제
  deleteMonster = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await Monster.delete(id);
    deletedResponse(res, '몬스터가 삭제되었습니다.');
  });

  // 몬스터 통계 조회
  getMonsterStats = asyncHandler(async (req, res) => {
    const stats = await Monster.getStats();
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
    
    const result = await Monster.findAll(page, limit, filters);
    paginatedResponse(res, result.data, result.pagination, `"${searchTerm}" 검색 결과입니다.`);
  });
}

module.exports = new MonsterController();
