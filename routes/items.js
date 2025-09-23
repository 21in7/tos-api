const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { itemValidators, commonValidators } = require('../utils/validators');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 모든 아이템 조회 (페이지네이션, 필터링, 검색)
router.get('/', 
  validatePagination,
  handleValidationErrors,
  itemController.getAllItems
);

// 아이템 통계 조회
router.get('/stats',
  itemController.getItemStats
);

// 아이템 타입 목록 조회
router.get('/types',
  itemController.getItemTypes
);

// 아이템 희귀도 목록 조회
router.get('/rarities',
  itemController.getItemRarities
);

// 아이템 검색
router.get('/search',
  validatePagination,
  handleValidationErrors,
  itemController.searchItems
);

// 레벨 범위별 아이템 조회
router.get('/level/:minLevel/:maxLevel',
  validatePagination,
  handleValidationErrors,
  itemController.getItemsByLevelRange
);

// ID로 아이템 조회
router.get('/:id',
  validateId,
  handleValidationErrors,
  itemController.getItemById
);

// 이름으로 아이템 조회
router.get('/name/:name',
  itemController.getItemByName
);

// 타입별 아이템 조회
router.get('/type/:type',
  validatePagination,
  handleValidationErrors,
  itemController.getItemsByType
);

// 희귀도별 아이템 조회
router.get('/rarity/:rarity',
  validatePagination,
  handleValidationErrors,
  itemController.getItemsByRarity
);

// 새 아이템 생성
router.post('/',
  itemValidators.create,
  handleValidationErrors,
  itemController.createItem
);

// 아이템 업데이트
router.put('/:id',
  validateId,
  handleValidationErrors,
  itemController.updateItem
);

// 아이템 삭제
router.delete('/:id',
  validateId,
  handleValidationErrors,
  itemController.deleteItem
);

module.exports = router;
