const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');
const { attributeValidators, commonValidators } = require('../utils/validators');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 모든 속성 조회 (페이지네이션, 필터링, 검색)
router.get('/', 
  validatePagination,
  handleValidationErrors,
  attributeController.getAllAttributes
);

// 속성 통계 조회
router.get('/stats',
  attributeController.getAttributeStats
);

// 속성 타입 목록 조회
router.get('/types',
  attributeController.getAttributeTypes
);

// 속성 검색
router.get('/search',
  validatePagination,
  handleValidationErrors,
  attributeController.searchAttributes
);

// ID로 속성 조회
router.get('/:id',
  validateId,
  handleValidationErrors,
  attributeController.getAttributeById
);

// ID로 속성 조회 (관련 jobs와 skills 포함)
router.get('/:id/relations',
  validateId,
  handleValidationErrors,
  attributeController.getAttributeByIdWithRelations
);

// 이름으로 속성 조회
router.get('/name/:name',
  attributeController.getAttributeByName
);

// 타입별 속성 조회
router.get('/type/:type',
  validatePagination,
  handleValidationErrors,
  attributeController.getAttributesByType
);

// 조회 기능만 사용하므로 생성/수정/삭제 라우트는 제거됨

module.exports = router;