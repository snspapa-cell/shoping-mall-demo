const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    대시보드 통계 조회
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 이번 달 주문 (취소/환불 제외)
    const thisMonthOrders = await Order.find({
      createdAt: { $gte: thisMonthStart },
      status: { $nin: ['cancelled', 'refunded'] },
    });

    // 지난 달 주문 (취소/환불 제외)
    const lastMonthOrders = await Order.find({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: { $nin: ['cancelled', 'refunded'] },
    });

    // 이번 달 총 매출
    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, order) => sum + (order.pricing?.totalPrice || 0),
      0
    );

    // 지난 달 총 매출
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + (order.pricing?.totalPrice || 0),
      0
    );

    // 이번 달 주문 수
    const thisMonthOrderCount = thisMonthOrders.length;
    const lastMonthOrderCount = lastMonthOrders.length;

    // 이번 달 평균 주문액
    const thisMonthAvgOrder = thisMonthOrderCount > 0 
      ? Math.round(thisMonthRevenue / thisMonthOrderCount) 
      : 0;
    const lastMonthAvgOrder = lastMonthOrderCount > 0 
      ? Math.round(lastMonthRevenue / lastMonthOrderCount) 
      : 0;

    // 이번 달 신규 회원
    const thisMonthNewUsers = await User.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });

    // 지난 달 신규 회원
    const lastMonthNewUsers = await User.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    // 변화율 계산 함수
    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    const revenueChange = calculateChange(thisMonthRevenue, lastMonthRevenue);
    const orderChange = calculateChange(thisMonthOrderCount, lastMonthOrderCount);
    const userChange = calculateChange(thisMonthNewUsers, lastMonthNewUsers);
    const avgOrderChange = calculateChange(thisMonthAvgOrder, lastMonthAvgOrder);

    const stats = [
      {
        id: 1,
        label: '총 매출',
        value: `₩${thisMonthRevenue.toLocaleString()}`,
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        trend: revenueChange >= 0 ? 'up' : 'down',
        period: '지난 달 대비',
      },
      {
        id: 2,
        label: '주문 수',
        value: `${thisMonthOrderCount}건`,
        change: `${orderChange >= 0 ? '+' : ''}${orderChange.toFixed(1)}%`,
        trend: orderChange >= 0 ? 'up' : 'down',
        period: '지난 달 대비',
      },
      {
        id: 3,
        label: '신규 회원',
        value: `${thisMonthNewUsers}명`,
        change: `${userChange >= 0 ? '+' : ''}${userChange.toFixed(1)}%`,
        trend: userChange >= 0 ? 'up' : 'down',
        period: '지난 달 대비',
      },
      {
        id: 4,
        label: '평균 주문액',
        value: `₩${thisMonthAvgOrder.toLocaleString()}`,
        change: `${avgOrderChange >= 0 ? '+' : ''}${avgOrderChange.toFixed(1)}%`,
        trend: avgOrderChange >= 0 ? 'up' : 'down',
        period: '지난 달 대비',
      },
    ];

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 통계 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    최근 주문 조회
// @route   GET /api/dashboard/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const orders = await Order.find()
      .populate('user', 'username name')
      .sort({ createdAt: -1 })
      .limit(limit);

    const statusMap = {
      pending: '결제대기',
      paid: '결제완료',
      preparing: '상품준비중',
      shipped: '배송중',
      delivered: '배송완료',
      cancelled: '주문취소',
      refunded: '환불완료',
    };

    const recentOrders = orders.map((order) => ({
      id: order.orderNumber,
      customer: order.user?.name || order.user?.username || '탈퇴회원',
      product: order.items[0]?.name + (order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''),
      amount: `₩${order.pricing.totalPrice.toLocaleString()}`,
      status: statusMap[order.status] || order.status,
      date: order.createdAt.toISOString().slice(0, 10),
    }));

    res.json({
      success: true,
      data: recentOrders,
    });
  } catch (error) {
    console.error('최근 주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '최근 주문 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    베스트 상품 조회 (실제 판매 데이터 기반)
// @route   GET /api/dashboard/best-products
// @access  Private/Admin
const getBestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // 취소/환불되지 않은 주문에서 상품별 판매량 집계
    const salesData = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled', 'refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: limit },
    ]);

    const bestProducts = salesData.map((item, index) => ({
      id: index + 1,
      productId: item._id,
      name: item.name,
      sales: item.totalSales,
      revenue: `₩${item.totalRevenue.toLocaleString()}`,
    }));

    res.json({
      success: true,
      data: bestProducts,
    });
  } catch (error) {
    console.error('베스트 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '베스트 상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// @desc    주문 상태별 현황 조회
// @route   GET /api/dashboard/order-status
// @access  Private/Admin
const getOrderStatusSummary = async (req, res) => {
  try {
    // 상태별 주문 수 집계
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // 오늘 날짜 기준
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 신규 주문 수
    const todayNewOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // 상태별 데이터 정리
    const statusMap = {
      pending: { label: '결제대기', color: '#f59e0b', icon: 'clock' },
      paid: { label: '결제완료', color: '#3b82f6', icon: 'credit-card' },
      preparing: { label: '상품준비중', color: '#8b5cf6', icon: 'package' },
      shipped: { label: '배송중', color: '#06b6d4', icon: 'truck' },
      delivered: { label: '배송완료', color: '#10b981', icon: 'check-circle' },
      cancelled: { label: '주문취소', color: '#ef4444', icon: 'x-circle' },
      refunded: { label: '환불완료', color: '#6b7280', icon: 'rotate-ccw' },
    };

    const statusOrder = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    const summary = statusOrder.map((status) => {
      const found = statusCounts.find((s) => s._id === status);
      return {
        status,
        ...statusMap[status],
        count: found ? found.count : 0,
      };
    });

    // 전체 주문 수
    const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);

    // 처리 필요 주문 (결제완료 + 상품준비중)
    const needsProcessing = summary
      .filter((s) => ['paid', 'preparing'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      data: {
        summary,
        totalOrders,
        todayNewOrders,
        needsProcessing,
      },
    });
  } catch (error) {
    console.error('주문 상태 현황 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 현황 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getBestProducts,
  getOrderStatusSummary,
};

