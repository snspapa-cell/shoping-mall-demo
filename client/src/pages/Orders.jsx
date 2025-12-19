import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useOrder } from '../hooks/useOrder'
import './Orders.css'

// 마이페이지 탭 메뉴
const MYPAGE_TABS = [
  { id: 'overview', label: '내 정보', path: '/mypage' },
  { id: 'orders', label: '주문 내역', path: '/orders' },
  { id: 'addresses', label: '배송지 관리', path: '/mypage' },
  { id: 'password', label: '비밀번호 변경', path: '/mypage' },
]

// 가격 포맷
const formatPrice = (price) => price?.toLocaleString() || '0'

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 주문 상태
const ORDER_STATUS = {
  pending: { label: '결제대기', color: '#ff9800' },
  paid: { label: '결제완료', color: '#2196f3' },
  preparing: { label: '상품준비중', color: '#9c27b0' },
  shipped: { label: '배송중', color: '#00bcd4' },
  delivered: { label: '배송완료', color: '#4caf50' },
  cancelled: { label: '취소됨', color: '#f44336' },
  refunded: { label: '환불됨', color: '#795548' },
}

// 상태 탭 옵션
const STATUS_TABS = [
  { value: '', label: '전체', icon: '📋' },
  { value: 'pending', label: '결제대기', icon: '⏳' },
  { value: 'paid', label: '결제완료', icon: '✅' },
  { value: 'preparing', label: '상품준비', icon: '📦' },
  { value: 'shipped', label: '배송중', icon: '🚚' },
  { value: 'delivered', label: '배송완료', icon: '🎉' },
  { value: 'cancelled', label: '취소/환불', icon: '❌' },
]

// 기간 필터 옵션
const PERIOD_FILTERS = [
  { value: 1, label: '1개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
]

// 상태 탭 컴포넌트
const StatusTabs = memo(({ activeStatus, onStatusChange, statusCounts }) => (
  <div className="status-tabs">
    {STATUS_TABS.map(tab => (
      <button
        key={tab.value}
        className={`status-tab ${activeStatus === tab.value ? 'active' : ''}`}
        onClick={() => onStatusChange(tab.value)}
      >
        <span className="tab-icon">{tab.icon}</span>
        <span className="tab-label">{tab.label}</span>
        {statusCounts[tab.value || 'all'] > 0 && (
          <span className="tab-count">{statusCounts[tab.value || 'all']}</span>
        )}
      </button>
    ))}
  </div>
))

// 기간 필터 컴포넌트
const PeriodFilter = memo(({ activePeriod, onPeriodChange }) => (
  <div className="period-filter">
    <span className="filter-label">조회 기간</span>
    <div className="period-buttons">
      {PERIOD_FILTERS.map(period => (
        <button
          key={period.value}
          className={`period-btn ${activePeriod === period.value ? 'active' : ''}`}
          onClick={() => onPeriodChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  </div>
))

// 주문 카드 컴포넌트
const OrderCard = memo(({ order, onCancel, onViewDetail }) => {
  const status = ORDER_STATUS[order.status] || { label: order.status, color: '#999' }
  const firstItem = order.items?.[0]
  const itemCount = order.items?.length || 0

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <span className="order-date">{formatDate(order.createdAt)}</span>
          <span className="order-number">{order.orderNumber}</span>
        </div>
        <span 
          className="order-status"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="order-content">
        <div className="order-items" onClick={() => onViewDetail(order._id)}>
          <div className="item-preview">
            {firstItem?.image ? (
              <img src={firstItem.image} alt={firstItem.name} />
            ) : (
              <div className="no-image">NO IMAGE</div>
            )}
          </div>
          <div className="item-info">
            <span className="item-name">
              {firstItem?.name}
              {itemCount > 1 && ` 외 ${itemCount - 1}건`}
            </span>
            <span className="item-price">
              ₩{formatPrice(order.pricing?.totalPrice)}
            </span>
          </div>
        </div>

        <div className="order-actions">
          <button 
            className="btn-detail"
            onClick={() => onViewDetail(order._id)}
          >
            주문 상세
          </button>
          {(order.status === 'pending' || order.status === 'paid') && (
            <button 
              className="btn-cancel"
              onClick={() => onCancel(order._id)}
            >
              주문 취소
            </button>
          )}
          {order.status === 'delivered' && (
            <button className="btn-review">
              리뷰 작성
            </button>
          )}
          {order.shipping?.trackingNumber && (
            <button className="btn-tracking">
              배송 조회
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// 빈 주문 내역 컴포넌트
const EmptyOrders = memo(({ status }) => (
  <div className="empty-orders">
    <div className="empty-icon">📋</div>
    <h2>
      {status ? `${ORDER_STATUS[status]?.label || status} 주문이 없습니다` : '주문 내역이 없습니다'}
    </h2>
    <p>첫 주문을 해보세요!</p>
    <Link to="/" className="btn-shop">쇼핑하러 가기</Link>
  </div>
))

// 로그인 필요 컴포넌트
const LoginRequired = memo(() => (
  <div className="login-required">
    <div className="login-icon">🔒</div>
    <h2>로그인이 필요합니다</h2>
    <p>주문 내역을 확인하시려면 로그인해주세요.</p>
    <Link to="/login" className="btn-login">로그인하기</Link>
  </div>
))

// 마이페이지 사이드바 컴포넌트
const MyPageSidebar = memo(({ activeTab, onTabClick }) => (
  <aside className="mypage-sidebar">
    <nav className="mypage-nav">
      {MYPAGE_TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabClick(tab)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </aside>
))

// 주문 상세 모달
const OrderDetailModal = memo(({ order, onClose, onCancel }) => {
  if (!order) return null

  const status = ORDER_STATUS[order.status] || { label: order.status, color: '#999' }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>주문 상세</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 주문 정보 */}
          <section className="detail-section">
            <h3>주문 정보</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">주문번호</span>
                <span className="value">{order.orderNumber}</span>
              </div>
              <div className="info-item">
                <span className="label">주문일시</span>
                <span className="value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="label">주문상태</span>
                <span className="value">
                  <span className="status-badge" style={{ backgroundColor: status.color }}>
                    {status.label}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="label">결제수단</span>
                <span className="value">
                  {order.payment?.method === 'card' && '신용카드'}
                  {order.payment?.method === 'bank' && '무통장입금'}
                  {order.payment?.method === 'kakao' && '카카오페이'}
                  {order.payment?.method === 'naver' && '네이버페이'}
                  {order.payment?.method === 'toss' && '토스페이'}
                </span>
              </div>
            </div>
          </section>

          {/* 주문 상품 */}
          <section className="detail-section">
            <h3>주문 상품</h3>
            <div className="order-items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item-row">
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="no-image">NO IMG</div>
                    )}
                  </div>
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">수량: {item.quantity}개</span>
                  </div>
                  <div className="item-price">₩{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 배송지 정보 */}
          <section className="detail-section">
            <h3>배송지 정보</h3>
            <div className="shipping-info">
              <p><strong>수령인:</strong> {order.shippingAddress?.recipientName}</p>
              <p><strong>연락처:</strong> {order.shippingAddress?.phone}</p>
              <p>
                <strong>주소:</strong> ({order.shippingAddress?.zipCode}) {order.shippingAddress?.address} {order.shippingAddress?.addressDetail}
              </p>
              {order.shippingAddress?.deliveryRequest && (
                <p><strong>배송요청:</strong> {order.shippingAddress.deliveryRequest}</p>
              )}
            </div>
          </section>

          {/* 배송 추적 */}
          {order.shipping?.trackingNumber && (
            <section className="detail-section">
              <h3>배송 정보</h3>
              <div className="tracking-info">
                <p><strong>택배사:</strong> {order.shipping.courier}</p>
                <p><strong>운송장번호:</strong> {order.shipping.trackingNumber}</p>
                {order.shipping.shippedAt && (
                  <p><strong>발송일:</strong> {formatDate(order.shipping.shippedAt)}</p>
                )}
                {order.shipping.deliveredAt && (
                  <p><strong>배송완료:</strong> {formatDate(order.shipping.deliveredAt)}</p>
                )}
              </div>
            </section>
          )}

          {/* 결제 금액 */}
          <section className="detail-section">
            <h3>결제 금액</h3>
            <div className="pricing-info">
              <div className="pricing-row">
                <span>상품 금액</span>
                <span>₩{formatPrice(order.pricing?.itemsPrice)}</span>
              </div>
              <div className="pricing-row">
                <span>배송비</span>
                <span>{order.pricing?.shippingPrice === 0 ? '무료' : `₩${formatPrice(order.pricing?.shippingPrice)}`}</span>
              </div>
              {order.pricing?.discountAmount > 0 && (
                <div className="pricing-row discount">
                  <span>할인</span>
                  <span>-₩{formatPrice(order.pricing.discountAmount)}</span>
                </div>
              )}
              <div className="pricing-row total">
                <span>총 결제금액</span>
                <span>₩{formatPrice(order.pricing?.totalPrice)}</span>
              </div>
            </div>
          </section>

          {/* 취소/환불 정보 */}
          {(order.status === 'cancelled' || order.status === 'refunded') && order.cancellation && (
            <section className="detail-section">
              <h3>취소/환불 정보</h3>
              <div className="cancellation-info">
                {order.cancellation.reason && (
                  <p><strong>사유:</strong> {order.cancellation.reason}</p>
                )}
                {order.cancellation.cancelledAt && (
                  <p><strong>취소일:</strong> {formatDate(order.cancellation.cancelledAt)}</p>
                )}
                {order.cancellation.refundAmount > 0 && (
                  <p><strong>환불금액:</strong> ₩{formatPrice(order.cancellation.refundAmount)}</p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="modal-footer">
          {(order.status === 'pending' || order.status === 'paid') && (
            <button 
              className="btn-cancel-order"
              onClick={() => onCancel(order._id)}
            >
              주문 취소
            </button>
          )}
          <button className="btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
})

function Orders() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { getMyOrders, getOrderById, cancelOrder, loading } = useOrder()
  
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState(3) // 기본 3개월
  const [statusCounts, setStatusCounts] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 기간 시작일 계산
  const startDate = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - periodFilter)
    return date.toISOString().split('T')[0]
  }, [periodFilter])

  // 주문 목록 조회
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      // cancelled와 refunded를 함께 조회
      let status = statusFilter
      if (statusFilter === 'cancelled') {
        status = 'cancelled,refunded'
      }
      
      const result = await getMyOrders(page, 10, status)
      if (result.success) {
        // 기간 필터링 (클라이언트 사이드)
        const filteredOrders = result.data.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= new Date(startDate)
        })
        setOrders(filteredOrders)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('주문 목록 조회 실패:', error)
    }
  }, [getMyOrders, statusFilter, startDate])

  // 상태별 개수 조회 (간단 버전)
  const fetchStatusCounts = useCallback(async () => {
    try {
      const result = await getMyOrders(1, 100, '')
      if (result.success) {
        const counts = { all: result.data.length }
        result.data.forEach(order => {
          counts[order.status] = (counts[order.status] || 0) + 1
        })
        // cancelled와 refunded 합산
        counts['cancelled'] = (counts['cancelled'] || 0) + (counts['refunded'] || 0)
        setStatusCounts(counts)
      }
    } catch (error) {
      console.error('상태 개수 조회 실패:', error)
    }
  }, [getMyOrders])

  // 초기 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(1)
      fetchStatusCounts()
    }
  }, [isAuthenticated, fetchOrders, fetchStatusCounts])

  // 상태 필터 변경
  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status)
  }, [])

  // 기간 필터 변경
  const handlePeriodChange = useCallback((months) => {
    setPeriodFilter(months)
  }, [])

  // 페이지 변경
  const handlePageChange = useCallback((page) => {
    fetchOrders(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchOrders])

  // 주문 상세 보기
  const handleViewDetail = useCallback(async (orderId) => {
    try {
      setDetailLoading(true)
      const result = await getOrderById(orderId)
      if (result.success) {
        setSelectedOrder(result.data)
      }
    } catch (error) {
      alert('주문 정보를 불러오는데 실패했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }, [getOrderById])

  // 주문 취소
  const handleCancel = useCallback(async (orderId) => {
    if (!window.confirm('주문을 취소하시겠습니까?')) return

    try {
      const result = await cancelOrder(orderId, '고객 요청')
      if (result.success) {
        alert('주문이 취소되었습니다.')
        setSelectedOrder(null)
        fetchOrders(pagination.page)
        fetchStatusCounts()
      }
    } catch (error) {
      alert(error.message)
    }
  }, [cancelOrder, fetchOrders, fetchStatusCounts, pagination.page])

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  // 마이페이지 탭 클릭
  const handleTabClick = useCallback((tab) => {
    if (tab.id === 'orders') return // 이미 주문 내역 페이지
    navigate(tab.path, { state: { activeTab: tab.id } })
  }, [navigate])

  // 로그인 필요
  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-container">
          <LoginRequired />
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page mypage-layout">
      <Navbar />
      
      <div className="mypage-container">
        <div className="mypage-header">
          <h1>마이페이지</h1>
          <p className="welcome-message">
            <strong>{user?.username}</strong>님, 환영합니다!
          </p>
        </div>

        <div className="mypage-content">
          {/* 사이드바 */}
          <MyPageSidebar activeTab="orders" onTabClick={handleTabClick} />

          {/* 메인 컨텐츠 */}
          <main className="mypage-main">
            <div className="orders-content-wrapper">
              <h2 className="section-title">주문 내역</h2>
              
              {/* 상태 탭 */}
              <StatusTabs
                activeStatus={statusFilter}
                onStatusChange={handleStatusChange}
                statusCounts={statusCounts}
              />

              {/* 기간 필터 */}
              <PeriodFilter
                activePeriod={periodFilter}
                onPeriodChange={handlePeriodChange}
              />

              {/* 주문 목록 */}
              {loading ? (
                <div className="orders-loading">
                  <p>주문 내역을 불러오는 중...</p>
                </div>
              ) : orders.length === 0 ? (
                <EmptyOrders status={statusFilter} />
              ) : (
                <>
                  <div className="orders-count">
                    총 <strong>{orders.length}</strong>건의 주문
                  </div>

                  <div className="orders-list">
                    {orders.map(order => (
                      <OrderCard 
                        key={order._id} 
                        order={order} 
                        onCancel={handleCancel}
                        onViewDetail={handleViewDetail}
                      />
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {pagination.totalPages > 1 && (
                    <div className="orders-pagination">
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        이전
                      </button>
                      
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const startPage = Math.max(1, pagination.page - 2)
                        const page = startPage + i
                        if (page > pagination.totalPages) return null
                        return (
                          <button
                            key={page}
                            className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onCancel={handleCancel}
        />
      )}

      {/* 상세 로딩 오버레이 */}
      {detailLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>CUSTOMER CENTER</h4>
            <p className="phone">1234-5678</p>
            <p>평일 09:00 - 18:00</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 성찬몰. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default memo(Orders)
