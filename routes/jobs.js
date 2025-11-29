const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// 모든 직업 조회 (페이지네이션)
router.get('/', jobController.getAllJobs);

// 스타터 직업 조회
router.get('/starter/all', jobController.getStarterJobs);

// 직업 통계 조회
router.get('/stats/overview', jobController.getJobStats);

// ID로 직업 조회
router.get('/:id', jobController.getJobById);

// 이름으로 직업 조회
router.get('/name/:name', jobController.getJobByName);

// 직업 트리별 조회
router.get('/tree/:jobTree', jobController.getJobsByTree);

module.exports = router;
