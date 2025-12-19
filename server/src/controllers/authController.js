const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    회원가입
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, agreeMarketing } = req.body;

    // 필수 필드 확인
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '이름, 이메일, 비밀번호를 모두 입력해주세요.',
      });
    }

    // 이메일 형식 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '올바른 이메일 형식이 아닙니다.',
      });
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다.',
      });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 유저 생성
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer', // 일반 회원으로 가입
      agreeMarketing: agreeMarketing || false,
    });

    // JWT 토큰 생성
    const token = generateToken(user._id);

    // 비밀번호 제외하고 유저 정보 반환
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
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

// @desc    비밀번호 변경
// @route   PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 입력 확인
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      });
    }

    // 새 비밀번호 길이 확인
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.',
      });
    }

    // 현재 유저 조회
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 현재 비밀번호 검증
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.',
      });
    }

    // 새 비밀번호 해싱 및 저장
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  generateToken,
};

