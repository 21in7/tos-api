// Cloudflare Workers용 응답 유틸리티

export function calculatePagination(page, limit, total) {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    offset,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

export function successResponse(data, message = '성공') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function errorResponse(message, statusCode = 500, error = null) {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  };
}

export function paginatedResponse(data, pagination, message = '조회 성공') {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  };
}
