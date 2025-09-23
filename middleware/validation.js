const { validationResult } = require('express-validator');

// 입력 데이터 검증 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '입력 데이터 검증 실패',
      details: errors.array()
    });
  }
  
  next();
};

// 페이지네이션 검증
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      error: '페이지 번호는 1 이상이어야 합니다.'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: '페이지 크기는 1-100 사이여야 합니다.'
    });
  }
  
  req.pagination = { page, limit };
  next();
};

// ID 검증
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id < 1) {
    return res.status(400).json({
      error: '유효하지 않은 ID입니다.'
    });
  }
  
  req.params.id = id;
  next();
};

module.exports = {
  handleValidationErrors,
  validatePagination,
  validateId
};
