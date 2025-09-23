const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { body, validationResult } = require('express-validator');

// 모든 직업 조회 (페이지네이션)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // 필터 파라미터 처리
    if (req.query.job_tree) filters.job_tree = req.query.job_tree;
    if (req.query.is_starter !== undefined) filters.is_starter = parseInt(req.query.is_starter);
    if (req.query.search) filters.search = req.query.search;

    const result = await Job.findAll(page, limit, filters);

    res.json({
      success: true,
      message: '직업 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ID로 직업 조회
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Job.findById(id);

    res.json({
      success: true,
      message: '직업을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 조회 오류:', error);
    res.status(404).json({
      success: false,
      message: '직업을 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 이름으로 직업 조회
router.get('/name/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const result = await Job.findByName(name);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '직업을 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: '직업을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직업 트리별 조회
router.get('/tree/:jobTree', async (req, res) => {
  try {
    const jobTree = req.params.jobTree;
    const result = await Job.findByJobTree(jobTree);

    res.json({
      success: true,
      message: `${jobTree} 직업 트리 목록을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 트리별 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 트리별 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 스타터 직업 조회
router.get('/starter/all', async (req, res) => {
  try {
    const result = await Job.findStarterJobs();

    res.json({
      success: true,
      message: '스타터 직업 목록을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('스타터 직업 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '스타터 직업 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직업 통계 조회
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Job.getStats();

    res.json({
      success: true,
      message: '직업 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직업 생성
router.post('/', [
  body('ids').notEmpty().withMessage('직업 ID는 필수입니다.'),
  body('id_name').notEmpty().withMessage('직업 ID명은 필수입니다.'),
  body('name').notEmpty().withMessage('직업 이름은 필수입니다.'),
  body('job_tree').notEmpty().withMessage('직업 트리는 필수입니다.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터 검증 실패',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const result = await Job.create(req.body);

    res.status(201).json({
      success: true,
      message: '직업이 성공적으로 생성되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 생성 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직업 업데이트
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Job.update(id, req.body);

    res.json({
      success: true,
      message: '직업이 성공적으로 업데이트되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 업데이트 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 직업 삭제
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Job.delete(id);

    res.json({
      success: true,
      message: '직업이 성공적으로 삭제되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('직업 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '직업 삭제 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
