const express = require('express');
const router = express.Router();
const {
  createLookbook,
  getAllLookbooks,
  getActiveLookbooks,
  getLookbookById,
  updateLookbook,
  deleteLookbook,
  toggleLookbookStatus,
  reorderLookbooks,
  incrementLookbookClick,
  incrementLookbookView,
  getMediaTypes,
} = require('../controllers/lookbookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 공개 라우트
router.get('/active', getActiveLookbooks);
router.get('/types', getMediaTypes);
router.post('/:id/click', incrementLookbookClick);
router.post('/:id/view', incrementLookbookView);

// 관리자 전용 라우트
router.use(protect, adminOnly);

router.route('/')
  .get(getAllLookbooks)
  .post(createLookbook);

router.patch('/reorder', reorderLookbooks);

router.route('/:id')
  .get(getLookbookById)
  .put(updateLookbook)
  .delete(deleteLookbook);

router.patch('/:id/toggle', toggleLookbookStatus);

module.exports = router;

