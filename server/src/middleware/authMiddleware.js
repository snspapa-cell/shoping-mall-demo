const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const protect = async (req, res, next) => {
  try {
    let token;

    // Authorization 헤더에서 Bearer 토큰 추출
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 토큰이 없는 경우
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.',
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 토큰에서 추출한 ID로 유저 조회
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // req.user에 유저 정보 저장
    req.user = user;
    next();
  } catch (error) {
    // 토큰 만료 에러
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
      });
    }

    // 토큰 검증 실패
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 관리자 권한 확인 미들웨어
const adminOnly = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
    });
  }
};

module.exports = {
  protect,
  adminOnly,
};


