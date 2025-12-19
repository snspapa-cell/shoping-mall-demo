const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  removeSelectedItems,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// 모든 장바구니 라우트는 로그인 필요
router.use(protect);

// @route   GET /api/cart
// @desc    내 장바구니 조회
router.get('/', getCart);

// @route   POST /api/cart/items
// @desc    장바구니에 상품 추가
router.post('/items', addToCart);

// @route   PUT /api/cart/items/:productId
// @desc    장바구니 상품 수량 변경
router.put('/items/:productId', updateCartItem);

// @route   DELETE /api/cart/items/:productId
// @desc    장바구니에서 상품 삭제
router.delete('/items/:productId', removeFromCart);

// @route   POST /api/cart/remove-selected
// @desc    선택한 상품들 삭제
router.post('/remove-selected', removeSelectedItems);

// @route   DELETE /api/cart
// @desc    장바구니 비우기
router.delete('/', clearCart);

module.exports = router;





