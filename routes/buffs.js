const express = require('express');
const router = express.Router();
const Buff = require('../models/Buff');
const { body, validationResult } = require('express-validator');

// 모든 버프 조회 (페이지네이션)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // 필터 파라미터 처리
    if (req.query.ids) filters.ids = req.query.ids;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.search) filters.search = req.query.search;

    const result = await Buff.findAll(page, limit, filters);

    res.json({
      success: true,
      message: '버프 목록을 조회했습니다.',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ID로 버프 조회
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 숫자인지 확인 (ids 컬럼이 VARCHAR이므로)
    const result = await Buff.findById(id);

    res.json({
      success: true,
      message: '버프를 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 조회 오류:', error);
    res.status(404).json({
      success: false,
      message: '버프를 찾을 수 없습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 이름으로 버프 조회
router.get('/name/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const result = await Buff.findByName(name);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '버프를 찾을 수 없습니다.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: '버프를 조회했습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 타입별 버프 조회
router.get('/type/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const result = await Buff.findByType(type);

    res.json({
      success: true,
      message: `${type} 타입 버프 목록을 조회했습니다.`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('타입별 버프 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '타입별 버프 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 버프 통계 조회
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Buff.getStats();

    res.json({
      success: true,
      message: '버프 통계를 조회했습니다.',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 버프 생성
router.post('/', [
  body('name').notEmpty().withMessage('버프 이름은 필수입니다.'),
  body('type').notEmpty().withMessage('버프 타입은 필수입니다.')
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

    const result = await Buff.create(req.body);

    res.status(201).json({
      success: true,
      message: '버프가 성공적으로 생성되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 생성 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 버프 업데이트
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Buff.update(id, req.body);

    res.json({
      success: true,
      message: '버프가 성공적으로 업데이트되었습니다.',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 업데이트 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 버프 삭제
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Buff.delete(id);

    res.json({
      success: true,
      message: '버프가 성공적으로 삭제되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('버프 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '버프 삭제 중 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;