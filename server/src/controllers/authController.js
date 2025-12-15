const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    유저 로그인
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 입력 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 모두 입력해주세요.',
      });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 검증
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);

    // 비밀번호 제외하고 유저 정보 반환
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    현재 로그인한 유저 정보 조회
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 정보 조회 실패',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  generateToken,
};

