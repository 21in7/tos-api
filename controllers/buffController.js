const Buff = require('../models/Buff');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

class BuffController {
  // 모든 버프 조회
  getAllBuffs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      type: req.query.type,
      search: req.query.search
    };

    const dbHelpers = req.dbHelpers;
    const result = await Buff.findAll(page, limit, filters, dbHelpers);

    paginatedResponse(res, result.data, result.pagination, '버프 목록을 조회했습니다.');
  });

  // ID로 버프 조회
  getBuffById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dbHelpers = req.dbHelpers;

    const buff = await Buff.findById(id, dbHelpers);
    successResponse(res, buff, '버프를 조회했습니다.');
  });

  // 이름으로 버프 조회
  getBuffByName = asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const dbHelpers = req.dbHelpers;

    const buff = await Buff.findByName(name, dbHelpers);
    if (!buff) {
      return errorResponse(res, '버프를 찾을 수 없습니다.', 404);
    }

    successResponse(res, buff, '버프를 조회했습니다.');
  });

  // 타입별 버프 조회
  getBuffsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const dbHelpers = req.dbHelpers;

    const buffs = await Buff.findByType(type, dbHelpers);
    successResponse(res, buffs, `${type} 타입 버프 목록을 조회했습니다.`);
  });

  // 버프 통계 조회
  getBuffStats = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;
    const stats = await Buff.getStats(dbHelpers);
    successResponse(res, stats, '버프 통계를 조회했습니다.');
  });
}

module.exports = new BuffController();
