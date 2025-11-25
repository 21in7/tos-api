const express = require('express');
const router = express.Router();
const buffController = require('../controllers/buffController');

// 모든 버프 조회 (페이지네이션)
router.get('/', buffController.getAllBuffs);

// 버프 통계 조회
router.get('/stats/overview', buffController.getBuffStats);

// ID로 버프 조회
router.get('/:id', buffController.getBuffById);

// 이름으로 버프 조회
router.get('/name/:name', buffController.getBuffByName);

// 타입별 버프 조회
router.get('/type/:type', buffController.getBuffsByType);

module.exports = router;
