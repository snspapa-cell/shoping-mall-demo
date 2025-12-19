const Lookbook = require('../models/Lookbook');

/**
 * 룩북 생성
 * POST /api/lookbooks
 */
exports.createLookbook = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaType,
      thumbnail,
      image,
      videoUrl,
      videoPlatform,
      link,
      linkTarget,
      isActive,
      order,
    } = req.body;

    // 마지막 순서 가져오기
    const lastLookbook = await Lookbook.findOne().sort({ order: -1 });
    const newOrder = order !== undefined ? order : (lastLookbook?.order ?? -1) + 1;

    const lookbook = await Lookbook.create({
      title,
      description,
      mediaType,
      thumbnail,
      image,
      videoUrl,
      videoPlatform,
      link,
      linkTarget,
      isActive: isActive !== undefined ? isActive : true,
      order: newOrder,
    });

    res.status(201).json({
      success: true,
      message: '룩북이 생성되었습니다.',
      data: lookbook,
    });
  } catch (error) {
    console.error('룩북 생성 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '룩북 생성에 실패했습니다.',
    });
  }
};

/**
 * 모든 룩북 조회 (관리자용)
 * GET /api/lookbooks
 */
exports.getAllLookbooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, mediaType, isActive } = req.query;

    const query = {};
    if (mediaType) query.mediaType = mediaType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lookbook.countDocuments(query);

    const lookbooks = await Lookbook.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: lookbooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('룩북 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '룩북 목록 조회에 실패했습니다.',
    });
  }
};

/**
 * 활성화된 룩북 조회 (프론트엔드용)
 * GET /api/lookbooks/active
 */
exports.getActiveLookbooks = async (req, res) => {
  try {
    const lookbooks = await Lookbook.getActiveLookbooks();

    res.json({
      success: true,
      data: lookbooks,
    });
  } catch (error) {
    console.error('활성 룩북 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '룩북 조회에 실패했습니다.',
    });
  }
};

/**
 * 룩북 상세 조회
 * GET /api/lookbooks/:id
 */
exports.getLookbookById = async (req, res) => {
  try {
    const lookbook = await Lookbook.findById(req.params.id);

    if (!lookbook) {
      return res.status(404).json({
        success: false,
        message: '룩북을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: lookbook,
    });
  } catch (error) {
    console.error('룩북 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '룩북 조회에 실패했습니다.',
    });
  }
};

/**
 * 룩북 수정
 * PUT /api/lookbooks/:id
 */
exports.updateLookbook = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaType,
      thumbnail,
      image,
      videoUrl,
      videoPlatform,
      link,
      linkTarget,
      isActive,
      order,
    } = req.body;

    const lookbook = await Lookbook.findById(req.params.id);

    if (!lookbook) {
      return res.status(404).json({
        success: false,
        message: '룩북을 찾을 수 없습니다.',
      });
    }

    // 필드 업데이트
    if (title !== undefined) lookbook.title = title;
    if (description !== undefined) lookbook.description = description;
    if (mediaType !== undefined) lookbook.mediaType = mediaType;
    if (thumbnail !== undefined) lookbook.thumbnail = thumbnail;
    if (image !== undefined) lookbook.image = image;
    if (videoUrl !== undefined) lookbook.videoUrl = videoUrl;
    if (videoPlatform !== undefined) lookbook.videoPlatform = videoPlatform;
    if (link !== undefined) lookbook.link = link;
    if (linkTarget !== undefined) lookbook.linkTarget = linkTarget;
    if (isActive !== undefined) lookbook.isActive = isActive;
    if (order !== undefined) lookbook.order = order;

    await lookbook.save();

    res.json({
      success: true,
      message: '룩북이 수정되었습니다.',
      data: lookbook,
    });
  } catch (error) {
    console.error('룩북 수정 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '룩북 수정에 실패했습니다.',
    });
  }
};

/**
 * 룩북 삭제
 * DELETE /api/lookbooks/:id
 */
exports.deleteLookbook = async (req, res) => {
  try {
    const lookbook = await Lookbook.findByIdAndDelete(req.params.id);

    if (!lookbook) {
      return res.status(404).json({
        success: false,
        message: '룩북을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '룩북이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('룩북 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '룩북 삭제에 실패했습니다.',
    });
  }
};

/**
 * 룩북 활성화/비활성화 토글
 * PATCH /api/lookbooks/:id/toggle
 */
exports.toggleLookbookStatus = async (req, res) => {
  try {
    const lookbook = await Lookbook.findById(req.params.id);

    if (!lookbook) {
      return res.status(404).json({
        success: false,
        message: '룩북을 찾을 수 없습니다.',
      });
    }

    lookbook.isActive = !lookbook.isActive;
    await lookbook.save();

    res.json({
      success: true,
      message: `룩북이 ${lookbook.isActive ? '활성화' : '비활성화'}되었습니다.`,
      data: lookbook,
    });
  } catch (error) {
    console.error('룩북 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '룩북 상태 변경에 실패했습니다.',
    });
  }
};

/**
 * 룩북 순서 변경
 * PATCH /api/lookbooks/reorder
 */
exports.reorderLookbooks = async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }, ...]

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: '올바른 형식이 아닙니다.',
      });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { order: item.order },
      },
    }));

    await Lookbook.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: '순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('룩북 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '순서 변경에 실패했습니다.',
    });
  }
};

/**
 * 룩북 클릭 추적
 * POST /api/lookbooks/:id/click
 */
exports.incrementLookbookClick = async (req, res) => {
  try {
    await Lookbook.findByIdAndUpdate(req.params.id, {
      $inc: { clickCount: 1 },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('룩북 클릭 추적 오류:', error);
    res.status(500).json({
      success: false,
    });
  }
};

/**
 * 룩북 뷰 추적
 * POST /api/lookbooks/:id/view
 */
exports.incrementLookbookView = async (req, res) => {
  try {
    await Lookbook.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('룩북 뷰 추적 오류:', error);
    res.status(500).json({
      success: false,
    });
  }
};

/**
 * 미디어 타입 목록
 * GET /api/lookbooks/types
 */
exports.getMediaTypes = async (req, res) => {
  const { MEDIA_TYPE, VIDEO_PLATFORM } = require('../models/Lookbook');

  res.json({
    success: true,
    data: {
      mediaTypes: Object.entries(MEDIA_TYPE).map(([key, value]) => ({
        id: value,
        name: value === 'image' ? '이미지' : '동영상',
      })),
      videoPlatforms: [
        { id: VIDEO_PLATFORM.YOUTUBE_SHORTS, name: 'YouTube Shorts' },
        { id: VIDEO_PLATFORM.YOUTUBE, name: 'YouTube' },
        { id: VIDEO_PLATFORM.INSTAGRAM, name: 'Instagram Reels' },
        { id: VIDEO_PLATFORM.TIKTOK, name: 'TikTok' },
        { id: VIDEO_PLATFORM.OTHER, name: '기타' },
      ],
    },
  });
};




