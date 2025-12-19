const mongoose = require('mongoose');

// 리뷰 스키마
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 정보는 필수입니다.'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 정보는 필수입니다.'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, '주문 정보는 필수입니다.'],
    },
    rating: {
      type: Number,
      required: [true, '평점은 필수입니다.'],
      min: [1, '평점은 최소 1점 이상이어야 합니다.'],
      max: [5, '평점은 최대 5점까지 가능합니다.'],
    },
    title: {
      type: String,
      maxlength: [100, '제목은 100자 이내로 작성해주세요.'],
      default: '',
    },
    content: {
      type: String,
      required: [true, '리뷰 내용은 필수입니다.'],
      minlength: [10, '리뷰는 최소 10자 이상 작성해주세요.'],
      maxlength: [1000, '리뷰는 1000자 이내로 작성해주세요.'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 5;
        },
        message: '이미지는 최대 5개까지 첨부할 수 있습니다.',
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    adminReply: {
      content: {
        type: String,
        default: '',
      },
      repliedAt: {
        type: Date,
      },
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ rating: 1 });

// 한 주문에서 같은 상품에 대해 중복 리뷰 방지
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// 상품의 평균 평점 계산 static 메서드
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isHidden: false } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratingDistribution.forEach((rating) => {
      ratingCounts[rating]++;
    });

    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
      ratingCounts,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
};

// 도움이 됨 토글 메서드
reviewSchema.methods.toggleHelpful = function (userId) {
  const userIdStr = userId.toString();
  const index = this.helpfulUsers.findIndex(
    (id) => id.toString() === userIdStr
  );

  if (index === -1) {
    this.helpfulUsers.push(userId);
    this.helpfulCount++;
  } else {
    this.helpfulUsers.splice(index, 1);
    this.helpfulCount--;
  }

  return this.save();
};

// 관리자 답글 추가 메서드
reviewSchema.methods.addAdminReply = function (content) {
  this.adminReply = {
    content,
    repliedAt: new Date(),
  };
  return this.save();
};

// JSON 변환 설정
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

