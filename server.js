require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

const authRoute = require('./routes').auth;
const courseRoute = require('./routes').course;
require('./config/passport')(passport);

const app = express();
const port = process.env.PORT || 8080;

const helmet = require('helmet');

// ======================
// Middleware 設定
// ======================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================
//  MongoDB 資料庫連線
// ===========================
mongoose
  .connect(process.env.MONGODB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('成功連接到 MongoDB');

    // 連線成功後啟動伺服器
    app.listen(port, () => {
      console.log(` Server is running on port ${port}`);
    });
  })
  .catch((e) => {
    console.error('無法連接 MongoDB：', e);
  });

// ======================
//  API 路由註冊
// ======================
app.use('/api/user', authRoute);
app.use('/api/courses', courseRoute);

// ==========================
// 前端靜態檔案處理（Production）
// ==========================
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode');
  const staticPath = path.join(__dirname, 'client', 'build');
  app.use(express.static(staticPath));

  // fallback route：支援 React Router client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// ===========================
// 全域錯誤處理 middleware（未來可擴充）
// ===========================
const errorHandler = require('./middleware/error.middleware');

// ===========================
// 全域錯誤處理 middleware
// ===========================
app.use(errorHandler);

// 找不到路由時回應 404）
app.use((req, res) => {
  res.status(404).json({ message: '找不到該路由' });
});

// debug用
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ MongoDB URI 使用中：', process.env.MONGODB_CONNECTION);
}
