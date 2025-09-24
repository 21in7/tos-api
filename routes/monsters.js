const express = require('express');
const router = express.Router();
const monsterController = require('../controllers/monsterController');
const { monsterValidators, commonValidators } = require('../utils/validators');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 모든 몬스터 조회 (페이지네이션, 필터링, 검색)
router.get('/', 
  validatePagination,
  handleValidationErrors,
  monsterController.getAllMonsters
);

// 몬스터 통계 조회
router.get('/stats',
  monsterController.getMonsterStats
);

// 몬스터 검색
router.get('/search',
  validatePagination,
  handleValidationErrors,
  monsterController.searchMonsters
);

// 레벨 범위별 몬스터 조회
router.get('/level/:minLevel/:maxLevel',
  validatePagination,
  handleValidationErrors,
  monsterController.getMonstersByLevelRange
);

// ids로 몬스터 조회
router.get('/:id',
  validateId,
  handleValidationErrors,
  monsterController.getMonsterById
);

// 이름으로 몬스터 조회
router.get('/name/:name',
  monsterController.getMonsterByName
);


module.exports = router;
