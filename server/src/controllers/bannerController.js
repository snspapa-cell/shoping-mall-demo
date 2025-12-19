const Banner = require('../models/Banner');
const { BANNER_TYPE } = require('../models/Banner');

// @desc    활성 배너 목록 조회 (공개)
// @route   GET /api/banners/active
// @access  Public
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { startDate: null },
        { startDate: { $lte: now } },
      ],
    })
      .where('$or')
      .equals([
        { endDate: null },
        { endDate: { $gte: now } },
      ])
      .sort({ order: 1, createdAt: -1 });

    // 더 간단한 쿼리로 대체
    const activeBanners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // 날짜 필터링
    const filteredBanners = activeBanners.filter((banner) => {
      if (banner.startDate && now < new Date(banner.startDate)) return false;
      if (banner.endDate && now > new Date(banner.endDate)) return false;
      return true;
    });

    res.json({
      success: true,
      data: filteredBanners,
      count: filteredBanners.length,
    });
  } catch (error) {
    console.error('활성 배너 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배너 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 조회수 증가
// @route   POST /api/banners/:id/view
// @access  Public
const incrementBannerView = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('조회수 증가 오류:', error);
    res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 클릭수 증가
// @route   POST /api/banners/:id/click
// @access  Public
const incrementBannerClick = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('클릭수 증가 오류:', error);
    res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.',
    });
  }
};

// ============ 관리자 전용 ============

// @desc    전체 배너 목록 조회 (관리자)
// @route   GET /api/banners
// @access  Private/Admin
const getAllBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, isActive, search } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { subtitle: new RegExp(search, 'i') },
      ];
    }

    const [banners, total] = await Promise.all([
      Banner.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      Banner.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: banners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('배너 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배너 목록 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 상세 조회 (관리자)
// @route   GET /api/banners/:id
// @access  Private/Admin
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('배너 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배너 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 생성 (관리자)
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      backgroundColor,
      textColor,
      image,
      mobileImage,
      link,
      linkTarget,
      buttonText,
      type,
      isActive,
      order,
      startDate,
      endDate,
    } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      description,
      backgroundColor,
      textColor,
      image,
      mobileImage,
      link,
      linkTarget,
      buttonText,
      type,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    res.status(201).json({
      success: true,
      message: '배너가 생성되었습니다.',
      data: banner,
    });
  } catch (error) {
    console.error('배너 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '배너 생성 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 수정 (관리자)
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    const updateFields = [
      'title',
      'subtitle',
      'description',
      'backgroundColor',
      'textColor',
      'image',
      'mobileImage',
      'link',
      'linkTarget',
      'buttonText',
      'type',
      'isActive',
      'order',
      'startDate',
      'endDate',
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        banner[field] = req.body[field];
      }
    });

    await banner.save();

    res.json({
      success: true,
      message: '배너가 수정되었습니다.',
      data: banner,
    });
  } catch (error) {
    console.error('배너 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '배너 수정 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 삭제 (관리자)
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    await banner.deleteOne();

    res.json({
      success: true,
      message: '배너가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('배너 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '배너 삭제 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 순서 변경 (관리자)
// @route   PUT /api/banners/reorder
// @access  Private/Admin
const reorderBanners = async (req, res) => {
  try {
    const { bannerOrders } = req.body; // [{ id: '...', order: 0 }, ...]

    if (!Array.isArray(bannerOrders)) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
      });
    }

    const updatePromises = bannerOrders.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '배너 순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('배너 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '배너 순서 변경 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 활성화/비활성화 토글 (관리자)
// @route   PUT /api/banners/:id/toggle
// @access  Private/Admin
const toggleBannerActive = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: '배너를 찾을 수 없습니다.',
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: banner.isActive ? '배너가 활성화되었습니다.' : '배너가 비활성화되었습니다.',
      data: banner,
    });
  } catch (error) {
    console.error('배너 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배너 타입 목록 조회
// @route   GET /api/banners/types
// @access  Public
const getBannerTypes = async (req, res) => {
  res.json({
    success: true,
    data: BANNER_TYPE,
  });
};

module.exports = {
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
};




