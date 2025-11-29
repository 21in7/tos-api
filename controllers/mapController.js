const Map = require('../models/Map');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class MapController {
  // 모든 맵 조회
  getAllMaps = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      type: req.query.type,
      level: req.query.level ? parseInt(req.query.level) : undefined,
      has_cm: req.query.has_cm !== undefined ? parseInt(req.query.has_cm) : undefined,
      has_warp: req.query.has_warp !== undefined ? parseInt(req.query.has_warp) : undefined,
      star: req.query.star ? parseInt(req.query.star) : undefined,
      search: req.query.search
    };

    const dbHelpers = req.dbHelpers;
    const result = await Map.findAll(page, limit, filters, dbHelpers);

    paginatedResponse(res, result.data, result.pagination, '맵 목록을 조회했습니다.');
  });

  // ID로 맵 조회
  getMapById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dbHelpers = req.dbHelpers;

    const map = await Map.findById(id, dbHelpers);
    successResponse(res, map, '맵을 조회했습니다.');
  });

  // 이름으로 맵 조회
  getMapByName = asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const dbHelpers = req.dbHelpers;

    const map = await Map.findByName(name, dbHelpers);
    if (!map) {
      return errorResponse(res, '맵을 찾을 수 없습니다.', 404);
    }

    successResponse(res, map, '맵을 조회했습니다.');
  });

  // 타입별 맵 조회
  getMapsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const dbHelpers = req.dbHelpers;

    const maps = await Map.findByType(type, dbHelpers);
    successResponse(res, maps, `${type} 타입 맵 목록을 조회했습니다.`);
  });

  // 레벨별 맵 조회
  getMapsByLevel = asyncHandler(async (req, res) => {
    const level = parseInt(req.params.level);
    const dbHelpers = req.dbHelpers;

    const maps = await Map.findByLevel(level, dbHelpers);
    successResponse(res, maps, `레벨 ${level} 맵 목록을 조회했습니다.`);
  });

  // CM 가능 맵 조회
  getCMMaps = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;

    const maps = await Map.findCMMaps(dbHelpers);
    successResponse(res, maps, 'CM 가능 맵 목록을 조회했습니다.');
  });

  // 워프 가능 맵 조회
  getWarpMaps = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;

    const maps = await Map.findWarpMaps(dbHelpers);
    successResponse(res, maps, '워프 가능 맵 목록을 조회했습니다.');
  });

  // 맵 통계 조회
  getMapStats = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;
    const stats = await Map.getStats(dbHelpers);
    successResponse(res, stats, '맵 통계를 조회했습니다.');
  });
}

module.exports = new MapController();
