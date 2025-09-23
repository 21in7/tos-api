// API 응답 포맷 유틸리티

// 성공 응답
const successResponse = (res, data = null, message = '성공', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// 에러 응답
const errorResponse = (res, message = '오류가 발생했습니다.', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  });
};

// 페이지네이션 응답
const paginatedResponse = (res, data, pagination, message = '조회 성공') => {
  const { page, limit, total, totalPages } = pagination;
  
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// 생성 응답
const createdResponse = (res, data, message = '생성되었습니다.') => {
  return successResponse(res, data, message, 201);
};

// 업데이트 응답
const updatedResponse = (res, data, message = '업데이트되었습니다.') => {
  return successResponse(res, data, message, 200);
};

// 삭제 응답
const deletedResponse = (res, message = '삭제되었습니다.') => {
  return successResponse(res, null, message, 200);
};

// 페이지네이션 계산
const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  return {
    page,
    limit,
    offset,
    total,
    totalPages
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  calculatePagination
};
