import { useState, useEffect, useCallback, memo } from 'react'
import api from '../../utils/axios'
import { formatPrice } from '../../constants/adminData'
import './OrdersContent.css'

// 주문 상태 정보
const ORDER_STATUS_MAP = {
  pending: { label: '결제대기', class: 'status-pending', color: '#f59e0b', icon: '🕐' },
  paid: { label: '결제완료', class: 'status-paid', color: '#3b82f6', icon: '💳' },
  preparing: { label: '상품준비중', class: 'status-preparing', color: '#8b5cf6', icon: '📦' },
  shipped: { label: '배송중', class: 'status-shipped', color: '#06b6d4', icon: '🚚' },
  delivered: { label: '배송완료', class: 'status-delivered', color: '#10b981', icon: '✅' },
  cancelled: { label: '취소됨', class: 'status-cancelled', color: '#ef4444', icon: '❌' },
  refunded: { label: '환불됨', class: 'status-refunded', color: '#6b7280', icon: '↩️' },
}

// 상태 탭 순서
const STATUS_TABS = [
  { key: '', label: '전체', icon: '📋' },
  { key: 'pending', label: '결제대기', icon: '🕐' },
  { key: 'paid', label: '결제완료', icon: '💳' },
  { key: 'preparing', label: '준비중', icon: '📦' },
  { key: 'shipped', label: '배송중', icon: '🚚' },
  { key: 'delivered', label: '배송완료', icon: '✅' },
  { key: 'cancelled', label: '취소', icon: '❌' },
  { key: 'refunded', label: '환불', icon: '↩️' },
]

// 결제 수단 정보
const PAYMENT_METHOD_MAP = {
  card: { label: '신용카드', icon: '💳' },
  bank: { label: '무통장입금', icon: '🏦' },
  kakao: { label: '카카오페이', icon: '💛' },
  naver: { label: '네이버페이', icon: '💚' },
  toss: { label: '토스페이', icon: '💙' },
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 짧은 날짜 포맷
const formatShortDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 상태 배지 컴포넌트
const StatusBadge = memo(({ status }) => {
  const statusInfo = ORDER_STATUS_MAP[status] || { label: status, class: '' }
  return (
    <span 
      className={`order-status-badge ${statusInfo.class}`}
      style={{ '--status-color': statusInfo.color }}
    >
      {statusInfo.label}
    </span>
  )
})

// 상태 탭 컴포넌트
const StatusTabs = memo(({ activeStatus, onStatusChange, statusCounts }) => (
  <div className="status-tabs">
    {STATUS_TABS.map((tab) => (
      <button
        key={tab.key}
        className={`status-tab ${activeStatus === tab.key ? 'active' : ''}`}
        onClick={() => onStatusChange(tab.key)}
      >
        <span className="tab-icon">{tab.icon}</span>
        <span className="tab-label">{tab.label}</span>
        {statusCounts[tab.key] !== undefined && (
          <span className="tab-count">{statusCounts[tab.key] || 0}</span>
        )}
      </button>
    ))}
  </div>
))

// 주문 카드 컴포넌트 (모바일/카드 뷰용)
const OrderCard = memo(({ order, onClick }) => {
  const paymentInfo = PAYMENT_METHOD_MAP[order.payment?.method] || { label: order.payment?.method, icon: '💰' }
  
  return (
    <div className="order-card" onClick={() => onClick(order._id)}>
      <div className="card-header">
        <span className="order-number">{order.orderNumber}</span>
        <StatusBadge status={order.status} />
      </div>
      <div className="card-body">
        <div className="order-product-info">
          <span className="product-name">
            {order.items?.[0]?.name}
            {order.items?.length > 1 && <span className="more-items">+{order.items.length - 1}</span>}
          </span>
        </div>
        <div className="order-meta">
          <span className="customer-name">{order.shippingAddress?.recipientName || '-'}</span>
          <span className="order-date">{formatShortDate(order.createdAt)}</span>
        </div>
      </div>
      <div className="card-footer">
        <span className="payment-method">
          <span className="payment-icon">{paymentInfo.icon}</span>
          {paymentInfo.label}
        </span>
        <span className="order-amount">₩{formatPrice(order.pricing?.totalPrice)}</span>
      </div>
    </div>
  )
})

// 주문 진행 상태바 컴포넌트
const OrderProgressBar = memo(({ status }) => {
  const steps = [
    { key: 'paid', label: '결제완료', icon: '💳' },
    { key: 'preparing', label: '상품준비', icon: '📦' },
    { key: 'shipped', label: '배송중', icon: '🚚' },
    { key: 'delivered', label: '배송완료', icon: '✅' },
  ]

  // 취소/환불 상태인 경우
  if (status === 'cancelled' || status === 'refunded' || status === 'pending') {
    return null
  }

  const currentIndex = steps.findIndex(s => s.key === status)

  return (
    <div className="order-progress-bar">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div 
            key={step.key} 
            className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && <div className="step-line" />}
          </div>
        )
      })}
    </div>
  )
})

// 빠른 액션 버튼 컴포넌트
const QuickActionButtons = memo(({ order, onStatusChange, loading }) => {
  const actions = []

  // 결제완료 → 준비중
  if (order.status === 'paid') {
    actions.push({
      label: '상품 준비 시작',
      icon: '📦',
      status: 'preparing',
      color: '#8b5cf6',
    })
  }

  // 준비중 → 배송중 (배송정보 필요)
  if (order.status === 'preparing' && order.shipping?.trackingNumber) {
    actions.push({
      label: '배송 시작',
      icon: '🚚',
      status: 'shipped',
      color: '#06b6d4',
    })
  }

  // 배송중 → 배송완료
  if (order.status === 'shipped') {
    actions.push({
      label: '배송 완료 처리',
      icon: '✅',
      status: 'delivered',
      color: '#10b981',
    })
  }

  if (actions.length === 0) return null

  return (
    <div className="quick-action-buttons">
      {actions.map((action) => (
        <button
          key={action.status}
          className="quick-action-btn"
          style={{ '--action-color': action.color }}
          onClick={() => onStatusChange(order._id, action.status)}
          disabled={loading}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  )
})

// 주문 상세 모달
const OrderDetailModal = memo(({ order, onClose, onStatusChange, onShippingUpdate }) => {
  const [newStatus, setNewStatus] = useState(order.status)
  const [courier, setCourier] = useState(order.shipping?.courier || '')
  const [trackingNumber, setTrackingNumber] = useState(order.shipping?.trackingNumber || '')
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (status) => {
    const targetStatus = status || newStatus
    if (targetStatus === order.status) return
    setLoading(true)
    try {
      await onStatusChange(order._id, targetStatus)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStatusChange = async (orderId, status) => {
    setLoading(true)
    try {
      await onStatusChange(orderId, status)
    } finally {
      setLoading(false)
    }
  }

  const handleShippingUpdate = async () => {
    if (!courier || !trackingNumber) {
      alert('택배사와 운송장 번호를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      await onShippingUpdate(order._id, courier, trackingNumber)
    } finally {
      setLoading(false)
    }
  }

  // 배송 가능한 상태인지 확인
  const canInputShipping = ['paid', 'preparing', 'shipped'].includes(order.status)
  const needsShippingInfo = ['paid', 'preparing'].includes(order.status) && !order.shipping?.trackingNumber

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <h2>주문 상세</h2>
            <span className="modal-order-number">{order.orderNumber}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 주문 진행 상태바 */}
          <OrderProgressBar status={order.status} />

          {/* 현재 상태 표시 */}
          <div className="current-status-display">
            <StatusBadge status={order.status} />
            <span className="order-datetime">{formatDate(order.createdAt)}</span>
          </div>

          {/* 빠른 액션 버튼 */}
          <QuickActionButtons 
            order={order} 
            onStatusChange={handleQuickStatusChange}
            loading={loading}
          />

          {/* 배송 정보 입력 안내 (필요한 경우) */}
          {needsShippingInfo && (
            <div className="shipping-required-notice">
              <span className="notice-icon">📋</span>
              <span className="notice-text">
                배송 정보를 입력하면 자동으로 <strong>배송중</strong> 상태로 변경됩니다.
              </span>
            </div>
          )}

          {/* 배송 정보 입력 (상단에 강조) */}
          {canInputShipping && (
            <section className="detail-section shipping-input-section">
              <h3>🚚 배송 정보</h3>
              <div className="shipping-form-inline">
                <select value={courier} onChange={(e) => setCourier(e.target.value)}>
                  <option value="">택배사 선택</option>
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="한진택배">한진택배</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="운송장 번호 입력"
                />
                <button 
                  className="btn-save-shipping"
                  onClick={handleShippingUpdate}
                  disabled={loading || !courier || !trackingNumber}
                >
                  {loading ? '저장 중...' : '저장 및 배송시작'}
                </button>
              </div>
              {order.shipping?.trackingNumber && (
                <div className="current-shipping-info">
                  <span className="shipping-label">현재 배송정보:</span>
                  <span className="shipping-value">{order.shipping.courier} - {order.shipping.trackingNumber}</span>
                </div>
              )}
            </section>
          )}

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
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">수량: {item.quantity}개</span>
                  </div>
                  <div className="item-price">₩{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 주문자 & 배송지 정보 */}
          <section className="detail-section">
            <h3>배송지 정보</h3>
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">수령인</span>
                <span className="info-value">{order.shippingAddress?.recipientName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">연락처</span>
                <span className="info-value">{order.shippingAddress?.phone}</span>
              </div>
              <div className="info-row full">
                <span className="info-label">주소</span>
                <span className="info-value">
                  ({order.shippingAddress?.zipCode}) {order.shippingAddress?.address} {order.shippingAddress?.addressDetail}
                </span>
              </div>
              {order.shippingAddress?.deliveryRequest && (
                <div className="info-row full">
                  <span className="info-label">요청사항</span>
                  <span className="info-value delivery-request">{order.shippingAddress.deliveryRequest}</span>
                </div>
              )}
            </div>
          </section>

          {/* 결제 정보 */}
          <section className="detail-section">
            <h3>결제 정보</h3>
            <div className="pricing-card">
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
              <div className="payment-method-info">
                {PAYMENT_METHOD_MAP[order.payment?.method]?.icon} {PAYMENT_METHOD_MAP[order.payment?.method]?.label || order.payment?.method}
              </div>
            </div>
          </section>

          {/* 상태 변경 (고급) */}
          <section className="detail-section action-section">
            <h3>상태 변경 (고급)</h3>
            <div className="action-grid">
              <div className="action-card">
                <label>주문 상태 직접 변경</label>
                <div className="action-row">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {Object.entries(ORDER_STATUS_MAP).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                  <button 
                    className="btn-action primary"
                    onClick={handleStatusChange}
                    disabled={loading || newStatus === order.status}
                  >
                    변경
                  </button>
                </div>
              </div>

              {(order.status === 'paid' || order.status === 'preparing' || order.status === 'shipped') && (
                <div className="action-card">
                  <label>배송 정보 입력</label>
                  <div className="shipping-inputs">
                    <select value={courier} onChange={(e) => setCourier(e.target.value)}>
                      <option value="">택배사 선택</option>
                      <option value="CJ대한통운">CJ대한통운</option>
                      <option value="한진택배">한진택배</option>
                      <option value="롯데택배">롯데택배</option>
                      <option value="우체국택배">우체국택배</option>
                      <option value="로젠택배">로젠택배</option>
                    </select>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="운송장 번호"
                    />
                    <button 
                      className="btn-action"
                      onClick={handleShippingUpdate}
                      disabled={loading}
                    >
                      저장
                    </button>
                  </div>
                  {order.shipping?.trackingNumber && (
                    <p className="current-tracking">
                      현재: {order.shipping.courier} - {order.shipping.trackingNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
})

// 메인 주문 관리 컴포넌트
function OrdersContent({ initialStatusFilter = '' }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'
  const [statusCounts, setStatusCounts] = useState({})
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // 페이지네이션
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  // initialStatusFilter 변경 시 업데이트
  useEffect(() => {
    if (initialStatusFilter !== statusFilter) {
      setStatusFilter(initialStatusFilter)
      setPage(1)
    }
  }, [initialStatusFilter])

  // 상태별 개수 조회
  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/order-status')
      const counts = { '': response.data.data.totalOrders }
      response.data.data.summary?.forEach(item => {
        counts[item.status] = item.count
      })
      setStatusCounts(counts)
    } catch (err) {
      console.error('상태별 개수 조회 실패:', err)
    }
  }, [])

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ page, limit: 20 })
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/orders?${params}`)
      setOrders(response.data.data || [])
      setPagination(response.data.pagination || { total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || '주문 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchTerm, startDate, endDate])

  useEffect(() => {
    fetchOrders()
    fetchStatusCounts()
  }, [fetchOrders, fetchStatusCounts])

  // 주문 상세 조회
  const handleOrderClick = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      setSelectedOrder(response.data.data)
    } catch (err) {
      alert('주문 정보를 불러오는데 실패했습니다.')
    }
  }

  // 주문 상태 변경
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus })
      alert('주문 상태가 변경되었습니다.')
      fetchOrders()
      fetchStatusCounts()
      const response = await api.get(`/orders/${orderId}`)
      setSelectedOrder(response.data.data)
    } catch (err) {
      alert(err.response?.data?.message || '상태 변경에 실패했습니다.')
    }
  }

  // 배송 정보 업데이트
  const handleShippingUpdate = async (orderId, courier, trackingNumber) => {
    try {
      await api.put(`/orders/${orderId}/shipping`, { courier, trackingNumber })
      alert('배송 정보가 저장되었습니다.')
      fetchOrders()
      const response = await api.get(`/orders/${orderId}`)
      setSelectedOrder(response.data.data)
    } catch (err) {
      alert(err.response?.data?.message || '배송 정보 저장에 실패했습니다.')
    }
  }

  // 상태 탭 변경
  const handleStatusTabChange = (status) => {
    setStatusFilter(status)
    setPage(1)
  }

  // 검색
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  // 필터 초기화
  const handleResetFilter = () => {
    setStatusFilter('')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  if (error) {
    return (
      <div className="orders-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchOrders}>다시 시도</button>
      </div>
    )
  }

  return (
    <div className="orders-content-v2">
      {/* 상태 탭 */}
      <StatusTabs 
        activeStatus={statusFilter}
        onStatusChange={handleStatusTabChange}
        statusCounts={statusCounts}
      />

      {/* 검색 & 필터 영역 */}
      <div className="orders-toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="주문번호, 수령인, 상품명 검색..."
            />
          </div>
          <div className="date-filter">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span className="date-separator">~</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-search">검색</button>
          {(searchTerm || startDate || endDate) && (
            <button type="button" className="btn-reset" onClick={handleResetFilter}>
              초기화
            </button>
          )}
        </form>

        <div className="toolbar-right">
          <span className="result-count">
            총 <strong>{pagination.total}</strong>건
          </span>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="테이블 보기"
            >
              ☰
            </button>
            <button 
              className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="카드 보기"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="orders-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>주문 목록을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>주문이 없습니다</p>
            {statusFilter && (
              <button className="btn-show-all" onClick={() => setStatusFilter('')}>
                전체 주문 보기
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          <div className="orders-card-grid">
            {orders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                onClick={handleOrderClick}
              />
            ))}
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table-v2">
              <thead>
                <tr>
                  <th className="col-status">상태</th>
                  <th className="col-order">주문정보</th>
                  <th className="col-customer">주문자</th>
                  <th className="col-product">상품</th>
                  <th className="col-payment">결제</th>
                  <th className="col-date">일시</th>
                  <th className="col-action">관리</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const paymentInfo = PAYMENT_METHOD_MAP[order.payment?.method] || { label: order.payment?.method, icon: '💰' }
                  return (
                    <tr key={order._id} onClick={() => handleOrderClick(order._id)}>
                      <td className="col-status">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="col-order">
                        <span className="order-number">{order.orderNumber}</span>
                      </td>
                      <td className="col-customer">
                        <span className="customer-name">
                          {order.shippingAddress?.recipientName || order.user?.name || '-'}
                        </span>
                      </td>
                      <td className="col-product">
                        <div className="product-info">
                          <span className="product-name">{order.items?.[0]?.name}</span>
                          {order.items?.length > 1 && (
                            <span className="more-count">+{order.items.length - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="col-payment">
                        <div className="payment-info">
                          <span className="payment-amount">₩{formatPrice(order.pricing?.totalPrice)}</span>
                          <span className="payment-method">{paymentInfo.icon} {paymentInfo.label}</span>
                        </div>
                      </td>
                      <td className="col-date">
                        <span className="date-text">{formatShortDate(order.createdAt)}</span>
                      </td>
                      <td className="col-action">
                        <button 
                          className="btn-detail"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrderClick(order._id)
                          }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="orders-pagination-v2">
          <button 
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >
            ««
          </button>
          <button 
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            이전
          </button>
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  className={`page-num ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button 
            className="page-btn"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            다음
          </button>
          <button 
            className="page-btn"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(pagination.totalPages)}
          >
            »»
          </button>
        </div>
      )}

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onShippingUpdate={handleShippingUpdate}
        />
      )}
    </div>
  )
}

export default memo(OrdersContent)
