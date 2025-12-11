const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// GET    /api/users     - 모든 유저 조회
// POST   /api/users     - 유저 생성
router.route('/').get(getUsers).post(createUser);

// GET    /api/users/:id - 특정 유저 조회
// PUT    /api/users/:id - 유저 정보 수정
// DELETE /api/users/:id - 유저 삭제
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;

