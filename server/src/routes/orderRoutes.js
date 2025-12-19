const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  refundOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ============ 관리자 라우트 (먼저 정의해야 /:id와 충돌 방지) ============

// 전체 주문 목록 조회 (관리자)
router.get('/', protect, adminOnly, getAllOrders);

// 주문 통계 조회 (관리자)
router.get('/stats', protect, adminOnly, getOrderStats);

// ============ 사용자 라우트 ============

// 주문 생성
router.post('/', protect, createOrder);

// 내 주문 목록 조회
router.get('/my', protect, getMyOrders);

// 주문 상세 조회 (사용자 또는 관리자)
router.get('/:id', protect, getOrderById);

// 결제 완료 처리
router.put('/:id/pay', protect, updateOrderToPaid);

// 주문 취소
router.put('/:id/cancel', protect, cancelOrder);

// ============ 관리자 전용 라우트 (파라미터 사용) ============

// 주문 상태 변경 (관리자)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// 배송 정보 업데이트 (관리자)
router.put('/:id/shipping', protect, adminOnly, updateShippingInfo);

// 환불 처리 (관리자)
router.put('/:id/refund', protect, adminOnly, refundOrder);

module.exports = router;


