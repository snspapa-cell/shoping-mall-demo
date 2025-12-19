const mongoose = require('mongoose');

// 카테고리 목록
const CATEGORIES = [
  'BEST',
  '겨울신상',
  '패딩',
  'MADE',
  '오늘의특가',
  '아우터',
  '원피스',
  '니트',
  '티셔츠',
  '팬츠',
  '스커트',
  '악세서리',
];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU는 필수입니다.'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]+$/, 'SKU는 영문 대문자, 숫자, 하이픈(-)만 사용 가능합니다.'],
    },
    name: {
      type: String,
      required: [true, '상품 이름은 필수입니다.'],
      trim: true,
      minlength: [2, '상품 이름은 최소 2자 이상이어야 합니다.'],
      maxlength: [200, '상품 이름은 최대 200자까지 가능합니다.'],
    },
    price: {
      type: Number,
      required: [true, '상품 가격은 필수입니다.'],
      min: [0, '가격은 0원 이상이어야 합니다.'],
    },
    category: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      enum: {
        values: CATEGORIES,
        message: '유효한 카테고리를 선택해주세요.',
      },
    },
    images: {
      type: [String],
      required: [true, '상품 이미지는 필수입니다.'],
      validate: {
        validator: function(arr) {
          return arr.length >= 1 && arr.length <= 5;
        },
        message: '상품 이미지는 1개 이상 5개 이하로 등록해야 합니다.',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, '상품 설명은 최대 2000자까지 가능합니다.'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// 카테고리별 검색을 위한 인덱스
// 참고: sku 인덱스는 스키마의 unique: true 설정으로 자동 생성됨
productSchema.index({ category: 1 });

// 가격 정렬을 위한 인덱스
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

// 카테고리 목록 export (다른 곳에서 사용할 수 있도록)
Product.CATEGORIES = CATEGORIES;

module.exports = Product;

