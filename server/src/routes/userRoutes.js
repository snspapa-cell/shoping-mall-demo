const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 모든 라우트에 관리자 권한 필요
router.use(protect, adminOnly);

// GET    /api/users/stats - 회원 통계
router.get('/stats', getUserStats);

// GET    /api/users     - 모든 유저 조회
// POST   /api/users     - 유저 생성
router.route('/').get(getUsers).post(createUser);

// GET    /api/users/:id - 특정 유저 조회
// PUT    /api/users/:id - 유저 정보 수정
// DELETE /api/users/:id - 유저 삭제
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;

