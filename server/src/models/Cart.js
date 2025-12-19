const mongoose = require('mongoose');

// 장바구니 아이템 스키마
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 정보는 필수입니다.'],
    },
    quantity: {
      type: Number,
      required: [true, '수량은 필수입니다.'],
      min: [1, '수량은 최소 1개 이상이어야 합니다.'],
      max: [99, '수량은 최대 99개까지 가능합니다.'],
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// 장바구니 스키마
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 정보는 필수입니다.'],
      unique: true, // 사용자당 하나의 장바구니
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// 사용자별 장바구니 검색을 위한 인덱스
cartSchema.index({ user: 1 });

// 총 상품 개수 계산 가상 필드
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 총 금액 계산 메서드 (populate된 상태에서 사용)
cartSchema.methods.calculateTotal = function () {
  return this.items.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + item.product.price * item.quantity;
    }
    return total;
  }, 0);
};

// 상품 추가 메서드
cartSchema.methods.addItem = function (productId, quantity = 1) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity > 99) {
      existingItem.quantity = 99;
    }
  } else {
    this.items.push({
      product: productId,
      quantity,
      addedAt: new Date(),
    });
  }

  return this.save();
};

// 상품 수량 업데이트 메서드
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (!item) {
    throw new Error('장바구니에 해당 상품이 없습니다.');
  }

  if (quantity <= 0) {
    return this.removeItem(productId);
  }

  item.quantity = Math.min(quantity, 99);
  return this.save();
};

// 상품 제거 메서드
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// 장바구니 비우기 메서드
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// JSON 변환 시 가상 필드 포함
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;





