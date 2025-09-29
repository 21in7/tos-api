const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 임시 플래너 API (기본 구조만)
router.get('/', (req, res) => {
  successResponse(res, [], '플래너 저장 목록을 조회했습니다.');
});

router.get('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { id: req.params.id, name: '샘플 플래너' }, '플래너를 조회했습니다.');
});

// 조회 기능만 사용하므로 생성/수정/삭제 라우트는 제거됨

module.exports = router;
