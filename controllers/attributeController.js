const Attribute = require('../models/Attribute');
const { successResponse, errorResponse, paginatedResponse, createdResponse, updatedResponse, deletedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDbHelpers } = require('../config/database');

class AttributeController {
  // 모든 특성 조회
  getAllAttributes = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      type: req.query.type,
      search: req.query.search
    };

    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Attribute.findAll(page, limit, filters, dbHelpers);
    
    paginatedResponse(res, result.data, result.pagination, '특성 목록을 조회했습니다.');
  });

  // ids로 특성 조회
  getAttributeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const attribute = await Attribute.findById(id, dbHelpers);
    successResponse(res, attribute, '특성을 조회했습니다.');
  });

  // ids로 특성 조회 (관련 jobs와 skills 포함)
  getAttributeByIdWithRelations = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const attribute = await Attribute.findByIdWithRelations(id);
    successResponse(res, attribute, '특성과 관련 정보를 조회했습니다.');
  });

  // 이름으로 특성 조회
  getAttributeByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const attribute = await Attribute.findByName(name);
    if (!attribute) {
      return errorResponse(res, '특성을 찾을 수 없습니다.', 404);
    }
    
    successResponse(res, attribute, '특성을 조회했습니다.');
  });

  // 타입별 특성 조회
  getAttributesByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    
    const attributes = await Attribute.findByType(type);
    successResponse(res, attributes, `${type} 타입 특성들을 조회했습니다.`);
  });

  // 새 특성 생성
  createAttribute = asyncHandler(async (req, res) => {
    const attributeData = req.body;
    
    const newAttribute = await Attribute.create(attributeData);
    createdResponse(res, newAttribute, '특성이 생성되었습니다.');
  });

  // 특성 업데이트
  updateAttribute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedAttribute = await Attribute.update(id, updateData);
    updatedResponse(res, updatedAttribute, '특성이 업데이트되었습니다.');
  });

  // 특성 삭제
  deleteAttribute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await Attribute.delete(id);
    deletedResponse(res, '특성이 삭제되었습니다.');
  });

  // 특성 통계 조회
  getAttributeStats = asyncHandler(async (req, res) => {
    const stats = await Attribute.getStats();
    successResponse(res, stats, '특성 통계를 조회했습니다.');
  });

  // 특성 검색
  searchAttributes = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return errorResponse(res, '검색어를 입력해주세요.', 400);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { search: searchTerm };
    
    const result = await Attribute.findAll(page, limit, filters);
    paginatedResponse(res, result.data, result.pagination, `"${searchTerm}" 검색 결과입니다.`);
  });

  // 특성 타입 목록 조회
  getAttributeTypes = asyncHandler(async (req, res) => {
    const types = [
      { value: 'strength', label: '힘', description: '물리 공격력과 관련' },
      { value: 'agility', label: '민첩', description: '공격 속도와 회피율과 관련' },
      { value: 'intelligence', label: '지능', description: '마법 공격력과 마나와 관련' },
      { value: 'vitality', label: '체력', description: '생명력과 방어력과 관련' },
      { value: 'luck', label: '운', description: '크리티컬 확률과 드롭율과 관련' }
    ];
    
    successResponse(res, types, '특성 타입 목록을 조회했습니다.');
  });
}

module.exports = new AttributeController();
