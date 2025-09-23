const Item = require('../models/Item');
const { successResponse, errorResponse, paginatedResponse, createdResponse, updatedResponse, deletedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class ItemController {
  // 모든 아이템 조회
  getAllItems = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      type: req.query.type,
      rarity: req.query.rarity,
      minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
      maxLevel: req.query.maxLevel ? parseInt(req.query.maxLevel) : undefined,
      search: req.query.search
    };

    const result = await Item.findAll(page, limit, filters);
    
    paginatedResponse(res, result.data, result.pagination, '아이템 목록을 조회했습니다.');
  });

  // ID로 아이템 조회
  getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const item = await Item.findById(id);
    successResponse(res, item, '아이템을 조회했습니다.');
  });

  // 이름으로 아이템 조회
  getItemByName = asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const item = await Item.findByName(name);
    if (!item) {
      return errorResponse(res, '아이템을 찾을 수 없습니다.', 404);
    }
    
    successResponse(res, item, '아이템을 조회했습니다.');
  });

  // 타입별 아이템 조회
  getItemsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    
    const items = await Item.findByType(type);
    successResponse(res, items, `${type} 타입 아이템들을 조회했습니다.`);
  });

  // 희귀도별 아이템 조회
  getItemsByRarity = asyncHandler(async (req, res) => {
    const { rarity } = req.params;
    
    const items = await Item.findByRarity(rarity);
    successResponse(res, items, `${rarity} 등급 아이템들을 조회했습니다.`);
  });

  // 레벨 범위별 아이템 조회
  getItemsByLevelRange = asyncHandler(async (req, res) => {
    const { minLevel, maxLevel } = req.params;
    
    const items = await Item.findByLevelRange(parseInt(minLevel), parseInt(maxLevel));
    successResponse(res, items, `레벨 ${minLevel}-${maxLevel} 아이템들을 조회했습니다.`);
  });

  // 새 아이템 생성
  createItem = asyncHandler(async (req, res) => {
    const itemData = req.body;
    
    const newItem = await Item.create(itemData);
    createdResponse(res, newItem, '아이템이 생성되었습니다.');
  });

  // 아이템 업데이트
  updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedItem = await Item.update(id, updateData);
    updatedResponse(res, updatedItem, '아이템이 업데이트되었습니다.');
  });

  // 아이템 삭제
  deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await Item.delete(id);
    deletedResponse(res, '아이템이 삭제되었습니다.');
  });

  // 아이템 통계 조회
  getItemStats = asyncHandler(async (req, res) => {
    const stats = await Item.getStats();
    successResponse(res, stats, '아이템 통계를 조회했습니다.');
  });

  // 아이템 검색
  searchItems = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm) {
      return errorResponse(res, '검색어를 입력해주세요.', 400);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { search: searchTerm };
    
    const result = await Item.findAll(page, limit, filters);
    paginatedResponse(res, result.data, result.pagination, `"${searchTerm}" 검색 결과입니다.`);
  });

  // 아이템 타입 목록 조회
  getItemTypes = asyncHandler(async (req, res) => {
    const types = [
      { value: 'weapon', label: '무기', description: '공격력을 높이는 장비' },
      { value: 'armor', label: '방어구', description: '방어력을 높이는 장비' },
      { value: 'accessory', label: '액세서리', description: '특수 효과를 제공하는 장신구' },
      { value: 'consumable', label: '소모품', description: '사용하면 소모되는 아이템' },
      { value: 'material', label: '재료', description: '제작이나 강화에 사용되는 재료' }
    ];
    
    successResponse(res, types, '아이템 타입 목록을 조회했습니다.');
  });

  // 아이템 희귀도 목록 조회
  getItemRarities = asyncHandler(async (req, res) => {
    const rarities = [
      { value: 'common', label: '일반', description: '흔한 아이템', color: '#9CA3AF' },
      { value: 'uncommon', label: '고급', description: '조금 특별한 아이템', color: '#10B981' },
      { value: 'rare', label: '레어', description: '드문 아이템', color: '#3B82F6' },
      { value: 'epic', label: '에픽', description: '매우 드문 아이템', color: '#8B5CF6' },
      { value: 'legendary', label: '전설', description: '극도로 드문 아이템', color: '#F59E0B' }
    ];
    
    successResponse(res, rarities, '아이템 희귀도 목록을 조회했습니다.');
  });
}

module.exports = new ItemController();
