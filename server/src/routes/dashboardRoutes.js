const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentOrders,
  getBestProducts,
  getOrderStatusSummary,
} = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 모든 대시보드 라우트는 관리자 권한 필요
router.use(protect, adminOnly);

// @route   GET /api/dashboard/stats
// @desc    대시보드 통계 조회
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/recent-orders
// @desc    최근 주문 조회
router.get('/recent-orders', getRecentOrders);

// @route   GET /api/dashboard/best-products
// @desc    베스트 상품 조회
router.get('/best-products', getBestProducts);

// @route   GET /api/dashboard/order-status
// @desc    주문 상태별 현황 조회
router.get('/order-status', getOrderStatusSummary);

module.exports = router;

