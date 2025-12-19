const mongoose = require('mongoose');

// 배너 타입 enum
const BANNER_TYPE = {
  EVENT: 'event',           // 이벤트
  PROMOTION: 'promotion',   // 프로모션
  ADVERTISEMENT: 'advertisement', // 광고
  SEASON: 'season',         // 시즌 배너
  NEW_ARRIVAL: 'new_arrival', // 신상품
};

const bannerSchema = new mongoose.Schema(
  {
    // 기본 정보
    title: {
      type: String,
      required: [true, '배너 제목은 필수입니다.'],
      trim: true,
      maxlength: [100, '제목은 100자를 초과할 수 없습니다.'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, '부제목은 200자를 초과할 수 없습니다.'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, '설명은 500자를 초과할 수 없습니다.'],
      default: '',
    },

    // 스타일 설정
    backgroundColor: {
      type: String,
      default: '#f0f5e6',
    },
    textColor: {
      type: String,
      default: '#1a1a1a',
    },
    image: {
      type: String,  // 배경 이미지 URL
      default: '',
    },
    mobileImage: {
      type: String,  // 모바일용 이미지 URL
      default: '',
    },

    // 링크 설정
    link: {
      type: String,
      default: '',
    },
    linkTarget: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self',
    },
    buttonText: {
      type: String,
      default: '',
    },

    // 배너 타입 및 상태
    type: {
      type: String,
      enum: Object.values(BANNER_TYPE),
      default: BANNER_TYPE.EVENT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },

    // 기간 설정
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },

    // 통계
    viewCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ type: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// 현재 활성화된 배너인지 확인하는 가상 필드
bannerSchema.virtual('isCurrentlyActive').get(function () {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  // 시작일이 설정되어 있고 아직 시작 전이면 비활성
  if (this.startDate && now < this.startDate) return false;
  
  // 종료일이 설정되어 있고 이미 종료되었으면 비활성
  if (this.endDate && now > this.endDate) return false;
  
  return true;
});

// 활성 배너 조회 static 메서드
bannerSchema.statics.getActiveBanners = function () {
  const now = new Date();
  
  return this.find({
    isActive: true,
    $or: [
      { startDate: null },
      { startDate: { $lte: now } },
    ],
    $or: [
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  }).sort({ order: 1, createdAt: -1 });
};

// 조회수 증가 메서드
bannerSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// 클릭수 증가 메서드
bannerSchema.methods.incrementClickCount = function () {
  this.clickCount += 1;
  return this.save();
};

// JSON 변환 설정
bannerSchema.set('toJSON', { virtuals: true });
bannerSchema.set('toObject', { virtuals: true });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
module.exports.BANNER_TYPE = BANNER_TYPE;




