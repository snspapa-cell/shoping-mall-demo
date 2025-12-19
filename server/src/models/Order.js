const mongoose = require('mongoose');

// 주문 상품 스키마 (주문 당시 정보 스냅샷)
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 정보는 필수입니다.'],
    },
    name: {
      type: String,
      required: [true, '상품명은 필수입니다.'],
    },
    price: {
      type: Number,
      required: [true, '상품 가격은 필수입니다.'],
    },
    quantity: {
      type: Number,
      required: [true, '수량은 필수입니다.'],
      min: [1, '수량은 최소 1개 이상이어야 합니다.'],
    },
    image: {
      type: String,
    },
  },
  { _id: true }
);

// 배송지 정보 스키마
const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, '수령인 이름은 필수입니다.'],
    },
    phone: {
      type: String,
      required: [true, '연락처는 필수입니다.'],
    },
    zipCode: {
      type: String,
      required: [true, '우편번호는 필수입니다.'],
    },
    address: {
      type: String,
      required: [true, '주소는 필수입니다.'],
    },
    addressDetail: {
      type: String,
      default: '',
    },
    deliveryRequest: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// 결제 정보 스키마
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['card', 'bank', 'kakao', 'naver', 'toss', 'other'],
      required: [true, '결제 수단은 필수입니다.'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    paymentInfo: {
      pgProvider: String,
      payMethod: String,
      cardName: String,
      buyerName: String,
      buyerEmail: String,
      buyerTel: String,
    },
  },
  { _id: false }
);

// 금액 정보 스키마
const pricingSchema = new mongoose.Schema(
  {
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

// 배송 추적 정보 스키마
const shippingInfoSchema = new mongoose.Schema(
  {
    courier: {
      type: String,
      default: '',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { _id: false }
);

// 취소/환불 정보 스키마
const cancellationSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// 주문 상태 enum
const ORDER_STATUS = {
  PENDING: 'pending',           // 결제대기
  PAID: 'paid',                 // 결제완료
  PREPARING: 'preparing',       // 상품준비중
  SHIPPED: 'shipped',           // 배송중
  DELIVERED: 'delivered',       // 배송완료
  CANCELLED: 'cancelled',       // 취소됨
  REFUNDED: 'refunded',         // 환불됨
};

// 메인 주문 스키마
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 정보는 필수입니다.'],
    },
    items: {
      type: [orderItemSchema],
      required: [true, '주문 상품은 필수입니다.'],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: '최소 1개 이상의 상품이 필요합니다.',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, '배송지 정보는 필수입니다.'],
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    payment: {
      type: paymentSchema,
      required: [true, '결제 정보는 필수입니다.'],
    },
    pricing: {
      type: pricingSchema,
      required: [true, '금액 정보는 필수입니다.'],
    },
    shipping: {
      type: shippingInfoSchema,
      default: () => ({}),
    },
    cancellation: {
      type: cancellationSchema,
      default: () => ({}),
    },
    fromCart: {
      type: Boolean,
      default: false,
    },
    orderedProductIds: {
      type: [String],
      default: [],
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
// 참고: orderNumber 인덱스는 스키마의 unique: true 설정으로 자동 생성됨
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// 주문번호 생성 static 메서드
orderSchema.statics.generateOrderNumber = async function () {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 오늘 날짜의 마지막 주문번호 찾기
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${dateStr}`),
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `ORD-${dateStr}-${sequence.toString().padStart(5, '0')}`;
};

// 주문 총액 계산 메서드
orderSchema.methods.calculatePricing = function () {
  const itemsPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const shippingPrice = itemsPrice >= 50000 ? 0 : 3000; // 5만원 이상 무료배송
  const totalPrice = itemsPrice + shippingPrice - (this.pricing?.discountAmount || 0);

  this.pricing = {
    itemsPrice,
    shippingPrice,
    discountAmount: this.pricing?.discountAmount || 0,
    totalPrice: Math.max(0, totalPrice),
  };

  return this.pricing;
};

// 주문 상태 변경 메서드
orderSchema.methods.updateStatus = function (newStatus) {
  const validTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PAID]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.REFUNDED]: [],
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`${this.status}에서 ${newStatus}로 상태 변경이 불가능합니다.`);
  }

  this.status = newStatus;

  // 상태에 따른 추가 처리
  if (newStatus === ORDER_STATUS.PAID) {
    this.payment.status = 'completed';
    this.payment.paidAt = new Date();
  } else if (newStatus === ORDER_STATUS.SHIPPED) {
    this.shipping.shippedAt = new Date();
  } else if (newStatus === ORDER_STATUS.DELIVERED) {
    this.shipping.deliveredAt = new Date();
  } else if (newStatus === ORDER_STATUS.CANCELLED) {
    this.cancellation.cancelledAt = new Date();
    this.payment.status = 'cancelled';
  } else if (newStatus === ORDER_STATUS.REFUNDED) {
    this.cancellation.refundedAt = new Date();
    this.cancellation.refundAmount = this.pricing.totalPrice;
    this.payment.status = 'refunded';
  }

  return this.save();
};

// 배송 정보 업데이트 메서드
orderSchema.methods.updateShippingInfo = function (courier, trackingNumber) {
  this.shipping.courier = courier;
  this.shipping.trackingNumber = trackingNumber;
  return this.save();
};

// JSON 변환 설정
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUS = ORDER_STATUS;

