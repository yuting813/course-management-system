const router = require('express').Router();
const { registerValidation, loginValidation } = require('../validation');
const User = require('../models').user;
const jwt = require('jsonwebtoken');

// Helpers
const throwError = (status, msg, code) => {
  const err = new Error(msg);
  err.statusCode = status;
  err.code = code;
  return err;
};

// Helpers
const normalizeEmail = (email) => (email || '').trim().toLowerCase();

router.post('/register', async (req, res, next) => {
  try {
    // 1) 驗證 + 清洗（吃到 schema 的 .strip()；並剝掉 schema 之外的鍵）
    const { error, value } = registerValidation(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return next(throwError(400, error.details[0].message, 'VALIDATION_ERROR'));

    // 2) 一律用「驗證/清洗後」的值，避免髒欄位滲入
    let { username, email, password, role, inviteCode } = value;
    email = normalizeEmail(email);

    // 3) Email 不可重複
    const emailExist = await User.findOne({ email });
    if (emailExist) return next(throwError(400, '此信箱已註冊過', 'EMAIL_EXISTS'));

    // 4) 僅講師需要驗證邀請碼（schema 已確保講師必填、學生 strip）
    if (role === 'instructor') {
      const inviteFromClient = (inviteCode || '').trim();
      const expected = process.env.INSTRUCTOR_INVITE_CODE;
      if (!expected) {
        return next(throwError(500, '發生未設定錯誤，請聯繫管理員', 'SERVER_CONFIG_ERROR'));
      }
      if (inviteFromClient !== expected) {
        return next(throwError(403, '講師邀請碼錯誤或已失效', 'INVALID_INVITE_CODE'));
      }
    }

    // 5) 建立使用者（以「清洗且正規化」的 email 落庫）
    const newUser = new User({ username, email, password, role });
    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: '成功註冊',
      data: { _id: savedUser._id, username, email, role },
    });
  } catch (e) {
    e.message = '新增使用者失敗: ' + e.message;
    return next(e);
  }
});

// 登入：同樣只用驗證後的 value
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginValidation(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return next(throwError(400, error.details[0].message, 'VALIDATION_ERROR'));

    const email = normalizeEmail(value.email);
    const password = value.password;

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return next(throwError(401, '無法找到使用者，請確認信箱是否正確', 'UNAUTHORIZED'));
    }

    const isMatch = await foundUser.comparePassword(password);
    if (!isMatch) return next(throwError(401, '密碼錯誤', 'UNAUTHORIZED'));

    const tokenObject = {
      _id: foundUser._id,
      email: foundUser.email,
      role: foundUser.role,
    };
    const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET, {
      expiresIn: '1d',
    });

    return res.status(200).json({
      success: true,
      message: '登入成功',
      token: 'JWT ' + token,
      user: {
        _id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
      },
    });
  } catch (e) {
    e.message = '登入過程中發生錯誤: ' + e.message;
    return next(e);
  }
});

module.exports = router;
