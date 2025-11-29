const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// 모든 맵 조회 (페이지네이션)
router.get('/', mapController.getAllMaps);

// CM 가능 맵 조회
router.get('/cm/available', mapController.getCMMaps);

// 워프 가능 맵 조회
router.get('/warp/available', mapController.getWarpMaps);

// 맵 통계 조회
router.get('/stats/overview', mapController.getMapStats);

// ID로 맵 조회
router.get('/:id', mapController.getMapById);

// 이름으로 맵 조회
router.get('/name/:name', mapController.getMapByName);

// 타입별 맵 조회
router.get('/type/:type', mapController.getMapsByType);

// 레벨별 맵 조회
router.get('/level/:level', mapController.getMapsByLevel);

module.exports = router;
