// 에러 로깅 및 처리 미들웨어
const errorHandler = (err, req, res, next) => {
  // 에러 로깅
  console.error('에러 발생:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // 데이터베이스 에러 처리
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: '데이터 중복 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // 데이터베이스 연결 오류
  if (err.code === 'SQLITE_CANTOPEN') {
    return res.status(503).json({
      error: '데이터베이스 연결에 실패했습니다.'
    });
  }

  // 기본 에러 처리
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// 404 에러 처리
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method
  });
};

// 비동기 에러 래퍼
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
