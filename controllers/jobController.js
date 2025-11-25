const Job = require('../models/Job');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateIconUrl } = require('../utils/iconCache');

class JobController {
  // 모든 직업 조회
  getAllJobs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      ids: req.query.ids,
      job_tree: req.query.job_tree,
      is_starter: req.query.is_starter !== undefined ? parseInt(req.query.is_starter) : undefined,
      search: req.query.search
    };

    const dbHelpers = req.dbHelpers;
    const result = await Job.findAll(page, limit, filters, dbHelpers);

    paginatedResponse(res, result.data, result.pagination, '직업 목록을 조회했습니다.');
  });

  // ID로 직업 조회
  getJobById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const dbHelpers = req.dbHelpers;

    // 먼저 ids 필드로 조회 시도
    let result;
    try {
      result = await Job.findById(id, dbHelpers);
    } catch (error) {
      // ids로 찾지 못하면 실제 id 필드로 조회 시도
      // Note: This fallback logic should ideally be in the Model, but refactoring strictly
      // based on existing route logic first.
      // However, for cleaner code, I'll assume Model handles basic retrieval or I call a fallback here.
      // Looking at previous route code, it did a raw query fallback.
      // I should probably push this fallback into the Model or keep it here using helpers.

      const query = 'SELECT * FROM Jobs_jobs WHERE id = ?';
      const rows = await dbHelpers.readQuery(query, [id]);

      if (rows.length === 0) {
        return errorResponse(res, '직업을 찾을 수 없습니다.', 404);
      }

      const row = rows[0];
      result = {
        ...row,
        icon_url: generateIconUrl(row.icon, 'icons', 'default-job')
      };
    }

    successResponse(res, result, '직업을 조회했습니다.');
  });

  // 이름으로 직업 조회
  getJobByName = asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const dbHelpers = req.dbHelpers;

    const job = await Job.findByName(name, dbHelpers);
    if (!job) {
      return errorResponse(res, '직업을 찾을 수 없습니다.', 404);
    }

    successResponse(res, job, '직업을 조회했습니다.');
  });

  // 직업 트리별 조회
  getJobsByTree = asyncHandler(async (req, res) => {
    const { jobTree } = req.params;
    const dbHelpers = req.dbHelpers;

    const jobs = await Job.findByJobTree(jobTree, dbHelpers);
    successResponse(res, jobs, `${jobTree} 직업 트리 목록을 조회했습니다.`);
  });

  // 스타터 직업 조회
  getStarterJobs = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;

    const jobs = await Job.findStarterJobs(dbHelpers);
    successResponse(res, jobs, '스타터 직업 목록을 조회했습니다.');
  });

  // 직업 통계 조회
  getJobStats = asyncHandler(async (req, res) => {
    const dbHelpers = req.dbHelpers;

    const stats = await Job.getStats(dbHelpers);
    successResponse(res, stats, '직업 통계를 조회했습니다.');
  });
}

module.exports = new JobController();
