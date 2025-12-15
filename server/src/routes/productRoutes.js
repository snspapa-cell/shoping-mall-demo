const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 공개 라우트 (인증 불필요)
// GET    /api/products/categories - 카테고리 목록 조회
router.get('/categories', getCategories);

// GET    /api/products     - 모든 상품 조회
router.get('/', getProducts);

// GET    /api/products/sku/:sku - SKU로 상품 조회
router.get('/sku/:sku', getProductBySku);

// GET    /api/products/:id - 특정 상품 조회
router.get('/:id', getProductById);

// 관리자 전용 라우트 (인증 + 관리자 권한 필요)
// POST   /api/products     - 상품 생성
router.post('/', protect, adminOnly, createProduct);

// PUT    /api/products/:id - 상품 정보 수정
router.put('/:id', protect, adminOnly, updateProduct);

// DELETE /api/products/:id - 상품 삭제
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;

