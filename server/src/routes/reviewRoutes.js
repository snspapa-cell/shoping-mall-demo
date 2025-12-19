const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getMyReviews,
  getWritableReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  addAdminReply,
  getAllReviews,
  toggleReviewVisibility,
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ============ 공개 라우트 ============
// 상품별 리뷰 목록 조회
router.get('/product/:productId', getProductReviews);

// ============ 사용자 라우트 ============
// 내 리뷰 목록 조회
router.get('/my', protect, getMyReviews);

// 리뷰 작성 가능한 상품 목록 조회
router.get('/writable', protect, getWritableReviews);

// 리뷰 작성
router.post('/', protect, createReview);

// 리뷰 수정
router.put('/:reviewId', protect, updateReview);

// 리뷰 삭제
router.delete('/:reviewId', protect, deleteReview);

// 리뷰 도움됨 토글
router.post('/:reviewId/helpful', protect, toggleHelpful);

// ============ 관리자 라우트 ============
// 전체 리뷰 목록 조회 (관리자)
router.get('/admin/all', protect, adminOnly, getAllReviews);

// 관리자 답글 작성
router.post('/:reviewId/reply', protect, adminOnly, addAdminReply);

// 리뷰 숨김/표시 토글 (관리자)
router.put('/:reviewId/toggle-visibility', protect, adminOnly, toggleReviewVisibility);

module.exports = router;

