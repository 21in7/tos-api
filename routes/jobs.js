const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { body, validationResult } = require('express-validator');
const { dbHelpers, getDbHelpers } = require('../config/database');
const { generateIconUrl } = require('../utils/iconCache');

// 모든 직업 조회 (페이지네이션)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // 필터 파라미터 처리
    if (req.query.ids) filters.ids = req.query.ids;
    if (req.query.job_tree) filters.job_tree = req.query.job_tree;
    if (req.query.is_starter !== undefined) filters.is_starter = parseInt(req.query.is_starter);
    if (req.query.search) filters.search = req.query.search;

    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Job.findAll(page, limit, filters, dbHelpers);

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

// ID로 직업 조회 (ids 또는 id 필드로 조회)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    // 먼저 ids 필드로 조회 시도
    let result;
    try {
      result = await Job.findById(id, dbHelpers);
    } catch (error) {
      // ids로 찾지 못하면 실제 id 필드로 조회 시도
      const query = 'SELECT * FROM Jobs_jobs WHERE id = ?';
      const rows = await dbHelpers.readQuery(query, [id]);
      
      if (rows.length === 0) {
        throw new Error('직업을 찾을 수 없습니다.');
      }
      
      const row = rows[0];
      result = {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      };
    }

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
    
    // 언어별 DB 헬퍼 사용
    const lang = req.language || 'ktos';
    const dbHelpers = getDbHelpers(lang);
    
    const result = await Job.findByName(name, dbHelpers);

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

// 조회 기능만 사용하므로 생성/수정/삭제 라우트는 제거됨

module.exports = router;
