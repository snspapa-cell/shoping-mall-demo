const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    내 장바구니 조회
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'sku name price images category',
    });

    // 장바구니가 없으면 새로 생성
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // 총 금액 계산
    const totalAmount = cart.calculateTotal();

    res.json({
      success: true,
      data: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    장바구니에 상품 추가
// @route   POST /api/cart/items
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 수량 유효성 검사
    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        message: '수량은 1~99 사이여야 합니다.',
      });
    }

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // 상품 추가
    await cart.addItem(productId, quantity);

    // populate해서 응답
    await cart.populate({
      path: 'items.product',
      select: 'sku name price images category',
    });

    const totalAmount = cart.calculateTotal();

    res.status(201).json({
      success: true,
      message: '상품이 장바구니에 추가되었습니다.',
      data: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 추가 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    장바구니 상품 수량 변경
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 수량 유효성 검사
    if (quantity === undefined || quantity < 0 || quantity > 99) {
      return res.status(400).json({
        success: false,
        message: '수량은 0~99 사이여야 합니다.',
      });
    }

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 수량 업데이트
    await cart.updateItemQuantity(productId, quantity);

    // populate해서 응답
    await cart.populate({
      path: 'items.product',
      select: 'sku name price images category',
    });

    const totalAmount = cart.calculateTotal();

    res.json({
      success: true,
      message: quantity === 0 ? '상품이 삭제되었습니다.' : '수량이 변경되었습니다.',
      data: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '수량 변경 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    장바구니에서 상품 삭제
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 상품 삭제
    await cart.removeItem(productId);

    // populate해서 응답
    await cart.populate({
      path: 'items.product',
      select: 'sku name price images category',
    });

    const totalAmount = cart.calculateTotal();

    res.json({
      success: true,
      message: '상품이 삭제되었습니다.',
      data: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    장바구니 비우기
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    // 장바구니 찾기
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 장바구니 비우기
    await cart.clearCart();

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: {
        _id: cart._id,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    선택한 상품들만 삭제
// @route   POST /api/cart/remove-selected
// @access  Private
const removeSelectedItems = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 상품을 선택해주세요.',
      });
    }

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 선택한 상품들 삭제
    cart.items = cart.items.filter(
      (item) => !productIds.includes(item.product.toString())
    );
    await cart.save();

    // populate해서 응답
    await cart.populate({
      path: 'items.product',
      select: 'sku name price images category',
    });

    const totalAmount = cart.calculateTotal();

    res.json({
      success: true,
      message: `${productIds.length}개 상품이 삭제되었습니다.`,
      data: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  removeSelectedItems,
};

