const Order = require('../models/Order');
const { ORDER_STATUS } = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const axios = require('axios');

// 포트원 API 설정
const PORTONE_API_KEY = process.env.PORTONE_API_KEY;
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

// 포트원 액세스 토큰 발급
const getPortoneAccessToken = async () => {
  try {
    const response = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: PORTONE_API_KEY,
      imp_secret: PORTONE_API_SECRET,
    });

    if (response.data.code === 0) {
      return response.data.response.access_token;
    }
    throw new Error('포트원 토큰 발급 실패');
  } catch (error) {
    console.error('포트원 토큰 발급 오류:', error.message);
    throw new Error('결제 검증 서비스에 연결할 수 없습니다.');
  }
};

// 포트원 결제 정보 조회
const getPortonePaymentInfo = async (impUid) => {
  try {
    const accessToken = await getPortoneAccessToken();
    
    const response = await axios.get(`https://api.iamport.kr/payments/${impUid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.code === 0) {
      return response.data.response;
    }
    throw new Error('결제 정보 조회 실패');
  } catch (error) {
    console.error('결제 정보 조회 오류:', error.message);
    throw new Error('결제 정보를 확인할 수 없습니다.');
  }
};

// 결제 금액 검증
const verifyPaymentAmount = async (impUid, expectedAmount) => {
  const paymentInfo = await getPortonePaymentInfo(impUid);

  if (paymentInfo.status !== 'paid') {
    throw new Error(`결제가 완료되지 않았습니다. 상태: ${paymentInfo.status}`);
  }

  if (paymentInfo.amount !== expectedAmount) {
    throw new Error(
      `결제 금액이 일치하지 않습니다. 예상: ${expectedAmount}원, 실제: ${paymentInfo.amount}원`
    );
  }

  return paymentInfo;
};

// @desc    주문 생성
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, items, useCart, selectedItems } = req.body;

    // ===== 1. 기존 pending 주문 처리 =====
    // 동일 사용자의 pending 상태 주문을 자동 취소 (결제 취소/실패 후 재시도 허용)
    const existingPendingOrders = await Order.find({
      user: req.user._id,
      status: ORDER_STATUS.PENDING,
    });

    // 기존 pending 주문들을 모두 취소 처리
    if (existingPendingOrders.length > 0) {
      console.log(`기존 pending 주문 ${existingPendingOrders.length}건 자동 취소 처리`);
      await Order.updateMany(
        {
          user: req.user._id,
          status: ORDER_STATUS.PENDING,
        },
        {
          $set: {
            status: ORDER_STATUS.CANCELLED,
            'payment.status': 'cancelled',
            'cancellation.reason': '새 주문 생성으로 인한 자동 취소',
            'cancellation.cancelledAt': new Date(),
          },
        }
      );
    }

    let orderItems = [];
    let orderedProductIds = []; // 주문된 상품 ID 저장 (결제 완료 시 장바구니에서 제거용)

    // 장바구니에서 주문하는 경우
    if (useCart) {
      const cart = await Cart.findOne({ user: req.user._id }).populate(
        'items.product'
      );

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: '장바구니가 비어있습니다.',
        });
      }

      // 선택된 상품만 필터링 (selectedItems가 있는 경우)
      let cartItems = cart.items;
      if (selectedItems && selectedItems.length > 0) {
        cartItems = cart.items.filter(item => 
          selectedItems.includes(item.product._id.toString())
        );

        if (cartItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: '선택된 상품이 장바구니에 없습니다.',
          });
        }
      }

      orderItems = cartItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
      }));

      // 주문된 상품 ID 저장
      orderedProductIds = cartItems.map(item => item.product._id.toString());
    }
    // 직접 상품을 지정하는 경우 (바로구매)
    else if (items && items.length > 0) {
      const productIds = items.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });

      const productMap = new Map(
        products.map((p) => [p._id.toString(), p])
      );

      orderItems = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`상품을 찾을 수 없습니다: ${item.productId}`);
        }
        return {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images?.[0] || '',
        };
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '주문 상품 정보가 필요합니다.',
      });
    }

    // 주문번호 생성
    const orderNumber = await Order.generateOrderNumber();

    // 주문 생성
    const order = new Order({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending',
      },
      pricing: {},
      fromCart: useCart || false, // 장바구니에서 주문했는지 표시
      orderedProductIds: orderedProductIds, // 주문된 상품 ID 목록 (장바구니에서 제거용)
    });

    // 금액 계산
    order.calculatePricing();

    await order.save();

    // 주의: 장바구니는 결제 완료 시에만 비움 (updateOrderToPaid에서 처리)

    res.status(201).json({
      success: true,
      message: '주문이 생성되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '주문 생성 중 오류가 발생했습니다.',
    });
  }
};

// @desc    내 주문 목록 조회
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name images'),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    주문 상세 조회
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images sku')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 관리자는 모든 주문 조회 가능
    if (req.user.user_type === 'admin') {
      return res.json({
        success: true,
        data: order,
      });
    }

    // 일반 사용자는 본인 주문만 조회 가능
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 상세 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    주문 상태 변경 (결제 완료 처리)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: '결제 정보(transactionId)가 필요합니다.',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 본인 주문만 결제 가능
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
      });
    }

    // 이미 결제 완료된 주문인지 체크
    if (order.status !== ORDER_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `이 주문은 이미 처리되었습니다. 현재 상태: ${order.status}`,
      });
    }

    // 동일 transactionId로 이미 결제된 주문이 있는지 체크 (중복 결제 방지)
    const existingPayment = await Order.findOne({
      'payment.transactionId': transactionId,
      _id: { $ne: order._id },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: '이미 처리된 결제입니다.',
      });
    }

    // ===== 결제 금액 검증 (포트원 API) =====
    // 환경변수가 설정된 경우에만 검증 수행 (개발 환경에서는 생략 가능)
    if (PORTONE_API_KEY && PORTONE_API_SECRET) {
      try {
        const paymentInfo = await verifyPaymentAmount(
          transactionId,
          order.pricing.totalPrice
        );

        // 검증 성공 시 결제 정보 저장
        order.payment.transactionId = transactionId;
        order.payment.verifiedAt = new Date();
        order.payment.paymentInfo = {
          pgProvider: paymentInfo.pg_provider,
          payMethod: paymentInfo.pay_method,
          cardName: paymentInfo.card_name,
          buyerName: paymentInfo.buyer_name,
          buyerEmail: paymentInfo.buyer_email,
          buyerTel: paymentInfo.buyer_tel,
        };
      } catch (verifyError) {
        console.error('결제 검증 실패:', verifyError.message);
        
        // 결제 검증 실패 시 주문 취소 처리
        order.cancellation.reason = `결제 검증 실패: ${verifyError.message}`;
        order.cancellation.cancelledAt = new Date();
        order.status = ORDER_STATUS.CANCELLED;
        order.payment.status = 'failed';
        await order.save();

        return res.status(400).json({
          success: false,
          message: verifyError.message,
        });
      }
    } else {
      // 포트원 API 키가 없으면 검증 없이 진행 (개발 환경)
      console.warn('⚠️ 포트원 API 키가 설정되지 않아 결제 검증을 생략합니다.');
      order.payment.transactionId = transactionId;
    }

    await order.updateStatus(ORDER_STATUS.PAID);

    // 결제 완료 시 장바구니에서 주문한 상품만 제거
    if (order.fromCart && order.orderedProductIds && order.orderedProductIds.length > 0) {
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { items: { product: { $in: order.orderedProductIds } } } }
      );
    } else if (order.fromCart) {
      // 이전 호환성을 위해 orderedProductIds가 없으면 전체 비우기
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [] }
      );
    }

    res.json({
      success: true,
      message: '결제가 완료되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('결제 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '결제 처리 중 오류가 발생했습니다.',
    });
  }
};

// @desc    주문 취소
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 본인 주문 또는 관리자만 취소 가능
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.user_type !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
      });
    }

    order.cancellation.reason = reason || '고객 요청';
    await order.updateStatus(ORDER_STATUS.CANCELLED);

    res.json({
      success: true,
      message: '주문이 취소되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '주문 취소 중 오류가 발생했습니다.',
    });
  }
};

// ============ 관리자 전용 ============

// @desc    전체 주문 목록 조회 (관리자)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, startDate, endDate, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'shippingAddress.recipientName': new RegExp(search, 'i') },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('items.product', 'name'),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('전체 주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
    });
  }
};

// @desc    주문 상태 변경 (관리자)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    if (adminNote) {
      order.adminNote = adminNote;
    }

    await order.updateStatus(status);

    res.json({
      success: true,
      message: '주문 상태가 변경되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '주문 상태 변경 중 오류가 발생했습니다.',
    });
  }
};

// @desc    배송 정보 업데이트 (관리자)
// @route   PUT /api/orders/:id/shipping
// @access  Private/Admin
const updateShippingInfo = async (req, res) => {
  try {
    const { courier, trackingNumber, autoChangeStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    await order.updateShippingInfo(courier, trackingNumber);

    // 배송중 상태로 자동 변경 (결제완료 또는 준비중 상태일 때)
    if (autoChangeStatus !== false) {
      if (order.status === ORDER_STATUS.PAID) {
        // 결제완료 → 준비중 → 배송중으로 바로 변경
        order.status = ORDER_STATUS.SHIPPED;
        order.shipping.shippedAt = new Date();
        await order.save();
      } else if (order.status === ORDER_STATUS.PREPARING) {
        await order.updateStatus(ORDER_STATUS.SHIPPED);
      }
    }

    res.json({
      success: true,
      message: '배송 정보가 업데이트되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('배송 정보 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '배송 정보 업데이트 중 오류가 발생했습니다.',
    });
  }
};

// @desc    환불 처리 (관리자)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const refundOrder = async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    order.cancellation.reason = reason || '관리자 환불 처리';
    if (refundAmount) {
      order.cancellation.refundAmount = refundAmount;
    }

    await order.updateStatus(ORDER_STATUS.REFUNDED);

    res.json({
      success: true,
      message: '환불 처리되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('환불 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '환불 처리 중 오류가 발생했습니다.',
    });
  }
};

// @desc    주문 통계 조회 (관리자)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      monthlyOrders,
      statusCounts,
      monthlySales,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] },
            createdAt: { $gte: thisMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalPrice' },
          },
        },
      ]),
    ]);

    const statusCountMap = {};
    statusCounts.forEach((item) => {
      statusCountMap[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthlyOrders,
        statusCounts: statusCountMap,
        monthlySales: monthlySales[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('주문 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 통계 조회 중 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  refundOrder,
  getOrderStats,
};

