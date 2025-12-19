const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    상품의 리뷰 목록 조회
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // 정렬 옵션
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({ product: productId, isHidden: false })
      .populate('user', 'name email')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ product: productId, isHidden: false });
    const stats = await Review.calculateAverageRating(productId);

    res.json({
      success: true,
      data: {
        reviews,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    내가 작성한 리뷰 목록 조회
// @route   GET /api/reviews/my
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images price')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
        },
      },
    });
  } catch (error) {
    console.error('내 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 작성 가능한 상품 목록 조회 (배송완료된 주문 상품 중 리뷰 미작성)
// @route   GET /api/reviews/writable
// @access  Private
const getWritableReviews = async (req, res) => {
  try {
    // 배송완료된 주문 조회
    const deliveredOrders = await Order.find({
      user: req.user._id,
      status: 'delivered',
    }).select('_id items orderNumber createdAt');

    // 이미 작성한 리뷰 조회
    const existingReviews = await Review.find({
      user: req.user._id,
    }).select('product order');

    const existingReviewMap = new Map();
    existingReviews.forEach((review) => {
      existingReviewMap.set(`${review.order}-${review.product}`, true);
    });

    // 리뷰 작성 가능한 상품 필터링
    const writableItems = [];
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const key = `${order._id}-${item.product}`;
        if (!existingReviewMap.has(key)) {
          writableItems.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            productId: item.product,
            productName: item.name,
            productImage: item.image,
            productPrice: item.price,
            quantity: item.quantity,
          });
        }
      }
    }

    res.json({
      success: true,
      data: writableItems,
    });
  } catch (error) {
    console.error('작성 가능 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 작성
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, content, images } = req.body;

    // 주문 확인 (본인 주문인지, 배송완료 상태인지)
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered',
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: '리뷰를 작성할 수 없는 주문입니다. 배송완료된 주문만 리뷰 작성이 가능합니다.',
      });
    }

    // 주문에 해당 상품이 있는지 확인
    const orderItem = order.items.find(
      (item) => item.product.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: '해당 주문에서 이 상품을 찾을 수 없습니다.',
      });
    }

    // 이미 리뷰를 작성했는지 확인
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '이미 이 상품에 대한 리뷰를 작성하셨습니다.',
      });
    }

    // 리뷰 생성
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: orderId,
      rating,
      title: title || '',
      content,
      images: images || [],
      isVerifiedPurchase: true,
    });

    // 상품의 리뷰 수 업데이트
    await Product.findByIdAndUpdate(productId, {
      $inc: { reviews: 1 },
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name')
      .populate('product', 'name');

    res.status(201).json({
      success: true,
      message: '리뷰가 작성되었습니다.',
      data: populatedReview,
    });
  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 이 상품에 대한 리뷰를 작성하셨습니다.',
      });
    }

    res.status(500).json({
      success: false,
      message: '리뷰 작성에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 수정
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, content, images } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    // 본인 리뷰인지 확인
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '본인의 리뷰만 수정할 수 있습니다.',
      });
    }

    // 리뷰 수정
    review.rating = rating || review.rating;
    review.title = title !== undefined ? title : review.title;
    review.content = content || review.content;
    review.images = images || review.images;

    await review.save();

    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'name')
      .populate('product', 'name');

    res.json({
      success: true,
      message: '리뷰가 수정되었습니다.',
      data: updatedReview,
    });
  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 수정에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 삭제
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    // 본인 리뷰이거나 관리자인지 확인
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.user_type !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: '삭제 권한이 없습니다.',
      });
    }

    const productId = review.product;

    await Review.findByIdAndDelete(reviewId);

    // 상품의 리뷰 수 감소
    await Product.findByIdAndUpdate(productId, {
      $inc: { reviews: -1 },
    });

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 삭제에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 도움됨 토글
// @route   POST /api/reviews/:reviewId/helpful
// @access  Private
const toggleHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    // 본인 리뷰에는 도움됨 불가
    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '본인의 리뷰에는 도움됨을 누를 수 없습니다.',
      });
    }

    await review.toggleHelpful(req.user._id);

    const isHelpful = review.helpfulUsers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful,
      },
    });
  } catch (error) {
    console.error('도움됨 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '처리에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    관리자 답글 작성
// @route   POST /api/reviews/:reviewId/reply
// @access  Private (Admin)
const addAdminReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '답글 내용을 입력해주세요.',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    await review.addAdminReply(content);

    res.json({
      success: true,
      message: '답글이 등록되었습니다.',
      data: review,
    });
  } catch (error) {
    console.error('관리자 답글 오류:', error);
    res.status(500).json({
      success: false,
      message: '답글 등록에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    전체 리뷰 목록 (관리자)
// @route   GET /api/reviews/admin/all
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, hasReply } = req.query;

    const filter = {};
    if (rating) {
      filter.rating = parseInt(rating);
    }
    if (hasReply === 'true') {
      filter['adminReply.content'] = { $ne: '' };
    } else if (hasReply === 'false') {
      filter['adminReply.content'] = '';
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
        },
      },
    });
  } catch (error) {
    console.error('전체 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// @desc    리뷰 숨김/표시 토글 (관리자)
// @route   PUT /api/reviews/:reviewId/toggle-visibility
// @access  Private (Admin)
const toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.',
      });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    res.json({
      success: true,
      message: review.isHidden ? '리뷰가 숨김 처리되었습니다.' : '리뷰가 표시됩니다.',
      data: review,
    });
  } catch (error) {
    console.error('리뷰 표시 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '처리에 실패했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getProductReviews,
  getMyReviews,
  getWritableReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  addAdminReply,
  getAllReviews,
  toggleReviewVisibility,
};

