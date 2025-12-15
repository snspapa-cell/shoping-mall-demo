const express = require('express');
const router = express.Router();

// 헬스 체크 라우트
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 라우트 등록
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
// router.use('/orders', require('./orderRoutes'));

module.exports = router;

