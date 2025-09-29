const express = require('express');
const router = express.Router();
const Buff = require('../models/Buff');
const { body, validationResult } = require('express-validator');
const { getDbHelpers } = require('../config/database');

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

    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Buff.findAll(page, limit, filters, dbHelpers);

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
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    // 숫자인지 확인 (ids 컬럼이 VARCHAR이므로)
    const result = await Buff.findById(id, dbHelpers);

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
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Buff.findByName(name, dbHelpers);

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
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Buff.findByType(type, dbHelpers);

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
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const stats = await Buff.getStats(dbHelpers);

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





module.exports = router;