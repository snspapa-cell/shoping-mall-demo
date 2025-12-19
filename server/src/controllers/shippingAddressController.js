const User = require('../models/User');

/**
 * 배송지 목록 조회
 * GET /api/shipping-addresses
 */
exports.getShippingAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: user.shippingAddresses || [],
    });
  } catch (error) {
    console.error('배송지 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배송지 목록 조회에 실패했습니다.',
    });
  }
};

/**
 * 기본 배송지 조회
 * GET /api/shipping-addresses/default
 */
exports.getDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const defaultAddress = user.getDefaultAddress();
    
    res.json({
      success: true,
      data: defaultAddress,
    });
  } catch (error) {
    console.error('기본 배송지 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '기본 배송지 조회에 실패했습니다.',
    });
  }
};

/**
 * 배송지 추가
 * POST /api/shipping-addresses
 */
exports.addShippingAddress = async (req, res) => {
  try {
    const { name, recipientName, phone, zipCode, address, addressDetail, isDefault } = req.body;
    
    // 유효성 검사
    if (!recipientName || !phone || !zipCode || !address) {
      return res.status(400).json({
        success: false,
        message: '수령인, 연락처, 우편번호, 주소는 필수입니다.',
      });
    }

    const user = await User.findById(req.user._id);
    
    await user.addShippingAddress({
      name: name || '배송지',
      recipientName,
      phone,
      zipCode,
      address,
      addressDetail: addressDetail || '',
      isDefault: isDefault || user.shippingAddresses.length === 0,
    });

    res.status(201).json({
      success: true,
      message: '배송지가 추가되었습니다.',
      data: user.shippingAddresses,
    });
  } catch (error) {
    console.error('배송지 추가 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '배송지 추가에 실패했습니다.',
    });
  }
};

/**
 * 배송지 수정
 * PUT /api/shipping-addresses/:id
 */
exports.updateShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, recipientName, phone, zipCode, address, addressDetail, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    
    await user.updateShippingAddress(id, {
      name,
      recipientName,
      phone,
      zipCode,
      address,
      addressDetail,
      isDefault,
    });

    res.json({
      success: true,
      message: '배송지가 수정되었습니다.',
      data: user.shippingAddresses,
    });
  } catch (error) {
    console.error('배송지 수정 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '배송지 수정에 실패했습니다.',
    });
  }
};

/**
 * 배송지 삭제
 * DELETE /api/shipping-addresses/:id
 */
exports.deleteShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    
    await user.removeShippingAddress(id);

    res.json({
      success: true,
      message: '배송지가 삭제되었습니다.',
      data: user.shippingAddresses,
    });
  } catch (error) {
    console.error('배송지 삭제 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '배송지 삭제에 실패했습니다.',
    });
  }
};

/**
 * 기본 배송지 설정
 * PATCH /api/shipping-addresses/:id/default
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    
    await user.setDefaultAddress(id);

    res.json({
      success: true,
      message: '기본 배송지가 설정되었습니다.',
      data: user.shippingAddresses,
    });
  } catch (error) {
    console.error('기본 배송지 설정 오류:', error);
    res.status(400).json({
      success: false,
      message: error.message || '기본 배송지 설정에 실패했습니다.',
    });
  }
};




