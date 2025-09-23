const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 임시 맵 API (기본 구조만)
router.get('/', (req, res) => {
  successResponse(res, [], '맵 목록을 조회했습니다.');
});

router.get('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { id: req.params.id, name: '샘플 맵' }, '맵을 조회했습니다.');
});

router.post('/', (req, res) => {
  successResponse(res, req.body, '맵이 생성되었습니다.');
});

router.put('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { ...req.body, id: req.params.id }, '맵이 업데이트되었습니다.');
});

router.delete('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, null, '맵이 삭제되었습니다.');
});

module.exports = router;
