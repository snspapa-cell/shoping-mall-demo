const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    모든 유저 조회 (페이지네이션, 검색)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, user_type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // 검색 쿼리 구성
    const query = {};

    if (search) {
      query.$or = [
        { email: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') },
      ];
    }

    if (user_type) {
      query.user_type = user_type;
    }

    // 정렬 설정
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 목록 조회 실패',
      error: error.message,
    });
  }
};

// @desc    회원 통계
// @route   GET /api/users/stats
const getUserStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalUsers,
      todayUsers,
      thisMonthUsers,
      lastMonthUsers,
      adminCount,
      customerCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
      User.countDocuments({ user_type: 'admin' }),
      User.countDocuments({ user_type: 'customer' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        todayUsers,
        thisMonthUsers,
        lastMonthUsers,
        adminCount,
        customerCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '회원 통계 조회 실패',
      error: error.message,
    });
  }
};

// @desc    특정 유저 조회
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

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
      message: '유저 조회 실패',
      error: error.message,
    });
  }
};

// @desc    유저 생성
// @route   POST /api/users
const createUser = async (req, res) => {
  try {
    const { email, username, password, user_type, address } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
      });
    }

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      user_type,
      address,
    });

    // 비밀번호 제외하고 응답
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '유저가 생성되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '유저 생성 실패',
      error: error.message,
    });
  }
};

// @desc    유저 정보 수정
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { email, username, password, user_type, address } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 이메일 변경 시 중복 확인
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 등록된 이메일입니다.',
        });
      }
    }

    // 필드 업데이트
    if (email) user.email = email;
    if (username) user.username = username;
    if (password) {
      // 비밀번호 변경 시 암호화
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (user_type) user.user_type = user_type;
    if (address !== undefined) user.address = address;

    await user.save();

    // 비밀번호 제외하고 응답
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: '유저 정보가 수정되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '유저 정보 수정 실패',
      error: error.message,
    });
  }
};

// @desc    유저 삭제
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '유저가 삭제되었습니다.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 삭제 실패',
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
};
