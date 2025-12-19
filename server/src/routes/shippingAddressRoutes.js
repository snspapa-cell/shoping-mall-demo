const express = require('express');
const router = express.Router();
const {
  getShippingAddresses,
  getDefaultAddress,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultAddress,
} = require('../controllers/shippingAddressController');
const { protect } = require('../middleware/authMiddleware');

// 모든 라우트에 인증 필요
router.use(protect);

// 배송지 목록 조회 및 추가
router.route('/')
  .get(getShippingAddresses)
  .post(addShippingAddress);

// 기본 배송지 조회
router.get('/default', getDefaultAddress);

// 배송지 수정/삭제
router.route('/:id')
  .put(updateShippingAddress)
  .delete(deleteShippingAddress);

// 기본 배송지 설정
router.patch('/:id/default', setDefaultAddress);

module.exports = router;




