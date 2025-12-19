const mongoose = require('mongoose');

// 미디어 타입 enum
const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
};

// 비디오 플랫폼 enum
const VIDEO_PLATFORM = {
  YOUTUBE: 'youtube',
  YOUTUBE_SHORTS: 'youtube_shorts',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  OTHER: 'other',
};

const lookbookSchema = new mongoose.Schema(
  {
    // 기본 정보
    title: {
      type: String,
      required: [true, '룩북 제목은 필수입니다.'],
      trim: true,
      maxlength: [100, '제목은 100자를 초과할 수 없습니다.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, '설명은 300자를 초과할 수 없습니다.'],
      default: '',
    },

    // 미디어 타입
    mediaType: {
      type: String,
      enum: Object.values(MEDIA_TYPE),
      default: MEDIA_TYPE.IMAGE,
    },

    // 썸네일 이미지 (이미지/동영상 모두 필요)
    thumbnail: {
      type: String,
      default: '',
    },

    // 이미지용 (mediaType이 'image'일 때)
    image: {
      type: String,
      default: '',
    },

    // 동영상용 (mediaType이 'video'일 때)
    videoUrl: {
      type: String,
      default: '',
    },
    videoPlatform: {
      type: String,
      enum: Object.values(VIDEO_PLATFORM),
      default: VIDEO_PLATFORM.YOUTUBE_SHORTS,
    },
    videoId: {
      type: String,  // 플랫폼별 비디오 ID (임베드용)
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

    // 상태 및 순서
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
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
lookbookSchema.index({ isActive: 1, order: 1 });

// 비디오 URL에서 ID 추출 (저장 전 처리)
lookbookSchema.pre('save', function (next) {
  if (this.mediaType === MEDIA_TYPE.VIDEO && this.videoUrl) {
    const url = this.videoUrl;

    // YouTube Shorts
    if (url.includes('youtube.com/shorts/')) {
      const match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
      if (match) {
        this.videoId = match[1];
        this.videoPlatform = VIDEO_PLATFORM.YOUTUBE_SHORTS;
      }
    }
    // YouTube 일반
    else if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (!match) {
        match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      }
      if (match) {
        this.videoId = match[1];
        this.videoPlatform = VIDEO_PLATFORM.YOUTUBE;
      }
    }
    // Instagram Reels
    else if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
      const match = url.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/);
      if (match) {
        this.videoId = match[2];
        this.videoPlatform = VIDEO_PLATFORM.INSTAGRAM;
      }
    }
    // TikTok
    else if (url.includes('tiktok.com')) {
      const match = url.match(/video\/(\d+)/);
      if (match) {
        this.videoId = match[1];
        this.videoPlatform = VIDEO_PLATFORM.TIKTOK;
      }
    }
    // 기타
    else {
      this.videoPlatform = VIDEO_PLATFORM.OTHER;
    }
  }

  next();
});

// 임베드 URL 생성 가상 필드
lookbookSchema.virtual('embedUrl').get(function () {
  if (this.mediaType !== MEDIA_TYPE.VIDEO || !this.videoId) return null;

  switch (this.videoPlatform) {
    case VIDEO_PLATFORM.YOUTUBE:
    case VIDEO_PLATFORM.YOUTUBE_SHORTS:
      return `https://www.youtube.com/embed/${this.videoId}`;
    case VIDEO_PLATFORM.INSTAGRAM:
      return `https://www.instagram.com/p/${this.videoId}/embed`;
    case VIDEO_PLATFORM.TIKTOK:
      return `https://www.tiktok.com/embed/v2/${this.videoId}`;
    default:
      return this.videoUrl;
  }
});

// 활성 룩북 조회 static 메서드
lookbookSchema.statics.getActiveLookbooks = function () {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
};

// JSON 변환 설정
lookbookSchema.set('toJSON', { virtuals: true });
lookbookSchema.set('toObject', { virtuals: true });

const Lookbook = mongoose.model('Lookbook', lookbookSchema);

module.exports = Lookbook;
module.exports.MEDIA_TYPE = MEDIA_TYPE;
module.exports.VIDEO_PLATFORM = VIDEO_PLATFORM;




