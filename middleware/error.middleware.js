module.exports = (err, req, res, next) => {
  // 記錄錯誤日誌（可串接 Winston 或其他 Log 服務）
  console.error('[Error Middleware]', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || '伺服器內部錯誤 (Internal Server Error)';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    message: message,
    code: code,
    // 開發環境下回傳 stack trace 以便除錯
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
