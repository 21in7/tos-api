const express = require('express');
const router = express.Router();
const Map = require('../models/Map');
const { body, validationResult } = require('express-validator');

// 모든 맵 조회 (페이지네이션)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // 필터 파라미터 처리
    if (req.query.type) filters.type = req.query.type;
    if (req.query.level) filters.level = parseInt(req.query.level);
    if (req.query.has_cm !== undefined) filters.has_cm = parseInt(req.query.has_cm);
    if (req.query.has_warp !== undefined) filters.has_warp = parseInt(req.query.has_warp);
    if (req.query.star) filters.star = parseInt(req.query.star);
    if (req.query.search) filters.search = req.query.search;

    const result = await Map.findAll(page, limit, filters);

    res.json({
      success: true,
      message: '맵 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ID로 맵 조회
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Map.findById(id);

    res.json({
      success: true,
      message: '맵을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 조회 오류:', error);
    res.status(404).json({
      success: false,
      message: '맵을 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 이름으로 맵 조회
router.get('/name/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const result = await Map.findByName(name);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '맵을 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: '맵을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 타입별 맵 조회
router.get('/type/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const result = await Map.findByType(type);

    res.json({
      success: true,
      message: `${type} 타입 맵 목록을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('타입별 맵 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '타입별 맵 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 레벨별 맵 조회
router.get('/level/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const result = await Map.findByLevel(level);

    res.json({
      success: true,
      message: `레벨 ${level} 맵 목록을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('레벨별 맵 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '레벨별 맵 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CM 가능 맵 조회
router.get('/cm/available', async (req, res) => {
  try {
    const result = await Map.findCMMaps();

    res.json({
      success: true,
      message: 'CM 가능 맵 목록을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('CM 가능 맵 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'CM 가능 맵 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 워프 가능 맵 조회
router.get('/warp/available', async (req, res) => {
  try {
    const result = await Map.findWarpMaps();

    res.json({
      success: true,
      message: '워프 가능 맵 목록을 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('워프 가능 맵 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '워프 가능 맵 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 맵 통계 조회
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Map.getStats();

    res.json({
      success: true,
      message: '맵 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 맵 생성
router.post('/', [
  body('ids').notEmpty().withMessage('맵 ID는 필수입니다.'),
  body('id_name').notEmpty().withMessage('맵 ID명은 필수입니다.'),
  body('name').notEmpty().withMessage('맵 이름은 필수입니다.'),
  body('type').notEmpty().withMessage('맵 타입은 필수입니다.'),
  body('level').isInt({ min: 1 }).withMessage('레벨은 1 이상의 정수여야 합니다.')
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

    const result = await Map.create(req.body);

    res.status(201).json({
      success: true,
      message: '맵이 성공적으로 생성되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 생성 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 맵 업데이트
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Map.update(id, req.body);

    res.json({
      success: true,
      message: '맵이 성공적으로 업데이트되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 업데이트 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 맵 삭제
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Map.delete(id);

    res.json({
      success: true,
      message: '맵이 성공적으로 삭제되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('맵 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '맵 삭제 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
