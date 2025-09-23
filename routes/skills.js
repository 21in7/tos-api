const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { skillValidators, commonValidators } = require('../utils/validators');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 모든 스킬 조회 (페이지네이션, 필터링, 검색)
router.get('/', 
  validatePagination,
  handleValidationErrors,
  skillController.getAllSkills
);

// 스킬 통계 조회
router.get('/stats',
  skillController.getSkillStats
);

// 스킬 타입 목록 조회
router.get('/types',
  skillController.getSkillTypes
);

// 스킬 검색
router.get('/search',
  validatePagination,
  handleValidationErrors,
  skillController.searchSkills
);

// ID로 스킬 조회
router.get('/:id',
  validateId,
  handleValidationErrors,
  skillController.getSkillById
);

// 이름으로 스킬 조회
router.get('/name/:name',
  skillController.getSkillByName
);

// 타입별 스킬 조회
router.get('/type/:type',
  validatePagination,
  handleValidationErrors,
  skillController.getSkillsByType
);

// 새 스킬 생성
router.post('/',
  skillValidators.create,
  handleValidationErrors,
  skillController.createSkill
);

// 스킬 업데이트
router.put('/:id',
  validateId,
  handleValidationErrors,
  skillController.updateSkill
);

// 스킬 삭제
router.delete('/:id',
  validateId,
  handleValidationErrors,
  skillController.deleteSkill
);

module.exports = router;
