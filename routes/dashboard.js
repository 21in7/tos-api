const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { handleValidationErrors, validatePagination } = require('../middleware/validation');

// 대시보드 전체 통계 조회
router.get('/stats',
  dashboardController.getDashboardStats
);

// 최근 추가된 데이터 조회
router.get('/recent',
  validatePagination,
  handleValidationErrors,
  dashboardController.getRecentData
);

// 시스템 상태 조회
router.get('/status',
  dashboardController.getSystemStatus
);

// 데이터베이스 테이블 정보 조회
router.get('/tables',
  dashboardController.getTableInfo
);

module.exports = router;
