const express = require('express');
const router = express.Router();
const {
  getActiveBanners,
  incrementBannerView,
  incrementBannerClick,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  toggleBannerActive,
  getBannerTypes,
} = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ============ 공개 라우트 ============

// 배너 타입 목록
router.get('/types', getBannerTypes);

// 활성 배너 목록 조회
router.get('/active', getActiveBanners);

// 조회수/클릭수 증가
router.post('/:id/view', incrementBannerView);
router.post('/:id/click', incrementBannerClick);

// ============ 관리자 라우트 ============

// 전체 배너 목록 조회 (관리자)
router.get('/', protect, adminOnly, getAllBanners);

// 배너 순서 변경 (관리자)
router.put('/reorder', protect, adminOnly, reorderBanners);

// 배너 상세 조회 (관리자)
router.get('/:id', protect, adminOnly, getBannerById);

// 배너 생성 (관리자)
router.post('/', protect, adminOnly, createBanner);

// 배너 수정 (관리자)
router.put('/:id', protect, adminOnly, updateBanner);

// 배너 삭제 (관리자)
router.delete('/:id', protect, adminOnly, deleteBanner);

// 배너 활성화/비활성화 토글 (관리자)
router.put('/:id/toggle', protect, adminOnly, toggleBannerActive);

module.exports = router;




