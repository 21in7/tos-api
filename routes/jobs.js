const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 임시 직업 API (기본 구조만)
router.get('/', (req, res) => {
  successResponse(res, [], '직업 목록을 조회했습니다.');
});

router.get('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { id: req.params.id, name: '샘플 직업' }, '직업을 조회했습니다.');
});

router.post('/', (req, res) => {
  successResponse(res, req.body, '직업이 생성되었습니다.');
});

router.put('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { ...req.body, id: req.params.id }, '직업이 업데이트되었습니다.');
});

router.delete('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, null, '직업이 삭제되었습니다.');
});

module.exports = router;
