const mongoose = require('mongoose');

// 배송지 스키마
const shippingAddressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '배송지명은 필수입니다.'],
      trim: true,
      default: '기본 배송지',
    },
    recipientName: {
      type: String,
      required: [true, '수령인 이름은 필수입니다.'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, '연락처는 필수입니다.'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, '우편번호는 필수입니다.'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, '주소는 필수입니다.'],
      trim: true,
    },
    addressDetail: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, '유효한 이메일 형식이 아닙니다.'],
    },
    username: {
      type: String,
      required: [true, '사용자명은 필수입니다.'],
      trim: true,
      minlength: [2, '사용자명은 최소 2자 이상이어야 합니다.'],
      maxlength: [50, '사용자명은 최대 50자까지 가능합니다.'],
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    },
    user_type: {
      type: String,
      required: [true, '사용자 유형은 필수입니다.'],
      enum: {
        values: ['customer', 'admin'],
        message: '사용자 유형은 customer 또는 admin이어야 합니다.',
      },
      default: 'customer',
    },
    // 배송지 목록
    shippingAddresses: {
      type: [shippingAddressSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// 기본 배송지 조회 메서드
userSchema.methods.getDefaultAddress = function () {
  return this.shippingAddresses.find(addr => addr.isDefault) || this.shippingAddresses[0] || null;
};

// 배송지 추가 메서드
userSchema.methods.addShippingAddress = function (addressData) {
  // 첫 번째 배송지이거나 기본배송지로 설정된 경우
  if (this.shippingAddresses.length === 0 || addressData.isDefault) {
    // 기존 기본배송지 해제
    this.shippingAddresses.forEach(addr => {
      addr.isDefault = false;
    });
    addressData.isDefault = true;
  }

  this.shippingAddresses.push(addressData);
  return this.save();
};

// 배송지 수정 메서드
userSchema.methods.updateShippingAddress = function (addressId, updateData) {
  const address = this.shippingAddresses.id(addressId);
  if (!address) {
    throw new Error('배송지를 찾을 수 없습니다.');
  }

  // 기본배송지로 설정하는 경우 다른 배송지의 기본 해제
  if (updateData.isDefault) {
    this.shippingAddresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  Object.assign(address, updateData);
  return this.save();
};

// 배송지 삭제 메서드
userSchema.methods.removeShippingAddress = function (addressId) {
  const address = this.shippingAddresses.id(addressId);
  if (!address) {
    throw new Error('배송지를 찾을 수 없습니다.');
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  // 삭제된 배송지가 기본이었고, 다른 배송지가 있으면 첫 번째를 기본으로
  if (wasDefault && this.shippingAddresses.length > 0) {
    this.shippingAddresses[0].isDefault = true;
  }

  return this.save();
};

// 기본 배송지 설정 메서드
userSchema.methods.setDefaultAddress = function (addressId) {
  const address = this.shippingAddresses.id(addressId);
  if (!address) {
    throw new Error('배송지를 찾을 수 없습니다.');
  }

  this.shippingAddresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId.toString();
  });

  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;

