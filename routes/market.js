const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');
const { handleValidationErrors, validatePagination, validateId } = require('../middleware/validation');

// 임시 거래소 API (기본 구조만)
router.get('/', (req, res) => {
  successResponse(res, [], '거래소 목록을 조회했습니다.');
});

router.get('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { id: req.params.id, item_id: 1, price: 100 }, '거래소 아이템을 조회했습니다.');
});

router.post('/', (req, res) => {
  successResponse(res, req.body, '거래소에 아이템이 등록되었습니다.');
});

router.put('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, { ...req.body, id: req.params.id }, '거래소 아이템이 업데이트되었습니다.');
});

router.delete('/:id', validateId, handleValidationErrors, (req, res) => {
  successResponse(res, null, '거래소 아이템이 삭제되었습니다.');
});

module.exports = router;
