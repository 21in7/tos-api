const Skill = require('../models/Skill');
const { successResponse, errorResponse, paginatedResponse, createdResponse, updatedResponse, deletedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDbHelpers } = require('../config/database');

class SkillController {
  // 모든 스킬 조회
  getAllSkills = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      job_id: req.query.job_id,
      type: req.query.type,
      search: req.query.search
    };

    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const result = await Skill.findAll(page, limit, filters, dbHelpers);
    
    paginatedResponse(res, result.data, result.pagination, '스킬 목록을 조회했습니다.');
  });

  // ID로 스킬 조회
  getSkillById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const skill = await Skill.findById(id, dbHelpers);
    successResponse(res, skill, '스킬을 조회했습니다.');
  });

  // 이름으로 스킬 조회
  getSkillByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const skill = await Skill.findByName(name, dbHelpers);
    if (!skill) {
      return errorResponse(res, '스킬을 찾을 수 없습니다.', 404);
    }
    
    successResponse(res, skill, '스킬을 조회했습니다.');
  });

  // 타입별 스킬 조회
  getSkillsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const skills = await Skill.findByType(type, dbHelpers);
    successResponse(res, skills, `${type} 타입 스킬들을 조회했습니다.`);
  });



  // 스킬 통계 조회
  getSkillStats = asyncHandler(async (req, res) => {
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const stats = await Skill.getStats(dbHelpers);
    successResponse(res, stats, '스킬 통계를 조회했습니다.');
  });

  // 스킬 검색
  searchSkills = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return errorResponse(res, '검색어를 입력해주세요.', 400);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { search: searchTerm };
    
    // 언어별 DB 헬퍼 사용
    const dbHelpers = req.dbHelpers;
    
    const result = await Skill.findAll(page, limit, filters, dbHelpers);
    paginatedResponse(res, result.data, result.pagination, `"${searchTerm}" 검색 결과입니다.`);
  });

  // 스킬 타입 목록 조회
  getSkillTypes = asyncHandler(async (req, res) => {
    const types = [
      { value: 'active', label: '액티브', description: '사용자가 직접 발동하는 스킬' },
      { value: 'passive', label: '패시브', description: '자동으로 적용되는 스킬' },
      { value: 'ultimate', label: '궁극기', description: '강력한 효과를 가진 특별한 스킬' }
    ];
    
    successResponse(res, types, '스킬 타입 목록을 조회했습니다.');
  });
}

module.exports = new SkillController();
