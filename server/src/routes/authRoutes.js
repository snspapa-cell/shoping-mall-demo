const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST   /api/auth/register - 회원가입
router.post('/register', register);

// POST   /api/auth/login - 로그인
router.post('/login', login);

// GET    /api/auth/me    - 현재 로그인한 유저 정보 조회 (인증 필요)
router.get('/me', protect, getMe);

// PUT    /api/auth/password - 비밀번호 변경 (인증 필요)
router.put('/password', protect, changePassword);

module.exports = router;




