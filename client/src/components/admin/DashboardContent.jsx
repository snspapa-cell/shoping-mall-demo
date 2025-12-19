import { memo, useState, useEffect, useCallback } from 'react'
import { 
  ProductIcon, 
  OrderIcon, 
  UserIcon, 
  SettingsIcon,
  TrendUpIcon,
  TrendDownIcon
} from '../icons/AdminIcons'
import api from '../../utils/axios'
import './DashboardContent.css'

// 주문 상태 아이콘 컴포넌트
const OrderStatusIcon = memo(({ icon, color }) => {
  const icons = {
    'clock': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    'credit-card': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    'package': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    'truck': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    'check-circle': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    'x-circle': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    'rotate-ccw': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  }
  return <span className="status-icon">{icons[icon] || null}</span>
})

// 상태 배지 컴포넌트
const StatusBadge = memo(({ status }) => {
  const statusStyles = {
    '배송중': 'status-shipping',
    '결제완료': 'status-paid',
    '배송완료': 'status-delivered',
    '주문취소': 'status-cancelled',
    '결제대기': 'status-pending',
    '상품준비중': 'status-preparing',
    '환불완료': 'status-refunded',
  }
  return <span className={`status-badge ${statusStyles[status] || ''}`}>{status}</span>
})

// 통계 카드 컴포넌트
const StatCard = memo(({ stat, loading }) => (
  <div className="stat-card">
    {loading ? (
      <div className="stat-loading">로딩 중...</div>
    ) : (
      <>
        <div className="stat-header">
          <span className="stat-label">{stat.label}</span>
          <span className={`stat-change ${stat.trend}`}>
            {stat.trend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
            {stat.change}
          </span>
        </div>
        <div className="stat-value">{stat.value}</div>
        <div className="stat-period">{stat.period}</div>
      </>
    )}
  </div>
))

// 주문 상태 카드 컴포넌트
const OrderStatusCard = memo(({ item, onClick, isActive }) => (
  <button 
    className={`order-status-card ${isActive ? 'active' : ''}`}
    onClick={() => onClick(item.status)}
    style={{ '--status-color': item.color }}
  >
    <div className="status-card-icon">
      <OrderStatusIcon icon={item.icon} color={item.color} />
    </div>
    <div className="status-card-info">
      <span className="status-card-count">{item.count}</span>
      <span className="status-card-label">{item.label}</span>
    </div>
  </button>
))

// 주문 상태 현황 섹션 컴포넌트
const OrderStatusSection = memo(({ statusData, loading, onStatusClick, onNavigateToOrders }) => {
  if (loading) {
    return (
      <section className="order-status-section">
        <div className="section-header">
          <h2>주문 현황</h2>
        </div>
        <div className="status-cards-loading">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="status-card-skeleton" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="order-status-section">
      <div className="section-header">
        <div className="header-left">
          <h2>주문 현황</h2>
          <div className="status-summary">
            <span className="summary-item total">
              전체 <strong>{statusData.totalOrders || 0}</strong>건
            </span>
            <span className="summary-divider">|</span>
            <span className="summary-item today">
              오늘 신규 <strong>{statusData.todayNewOrders || 0}</strong>건
            </span>
            {statusData.needsProcessing > 0 && (
              <>
                <span className="summary-divider">|</span>
                <span className="summary-item needs-action">
                  처리필요 <strong>{statusData.needsProcessing}</strong>건
                </span>
              </>
            )}
          </div>
        </div>
        <button className="view-all-btn" onClick={onNavigateToOrders}>
          주문관리 바로가기 →
        </button>
      </div>

      <div className="status-cards-grid">
        {statusData.summary?.map((item) => (
          <OrderStatusCard 
            key={item.status} 
            item={item} 
            onClick={onStatusClick}
            isActive={false}
          />
        ))}
      </div>

      {/* 처리 필요 알림 배너 */}
      {statusData.needsProcessing > 0 && (
        <div className="needs-processing-banner">
          <div className="banner-content">
            <span className="banner-icon">⚡</span>
            <span className="banner-text">
              <strong>{statusData.needsProcessing}건</strong>의 주문이 처리를 기다리고 있습니다
            </span>
          </div>
          <button className="banner-action" onClick={() => onStatusClick('paid')}>
            바로 처리하기
          </button>
        </div>
      )}
    </section>
  )
})

// 로딩 스켈레톤
const LoadingSkeleton = memo(({ count = 5 }) => (
  <div className="loading-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-row" />
    ))}
  </div>
))

// 대시보드 컨텐츠 컴포넌트
function DashboardContent({ onNavigateToProducts, onNavigateToOrders, onNavigateToUsers, onNavigateToSettings }) {
  const [stats, setStats] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [bestProducts, setBestProducts] = useState([])
  const [orderStatus, setOrderStatus] = useState({
    summary: [],
    totalOrders: 0,
    todayNewOrders: 0,
    needsProcessing: 0,
  })
  const [loading, setLoading] = useState({
    stats: true,
    orders: true,
    products: true,
    orderStatus: true,
  })
  const [error, setError] = useState(null)

  // 대시보드 데이터 로드
  const fetchDashboardData = useCallback(async () => {
    try {
      // 병렬로 모든 데이터 요청
      const [statsRes, ordersRes, productsRes, statusRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-orders'),
        api.get('/dashboard/best-products'),
        api.get('/dashboard/order-status'),
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data)
      }
      setLoading(prev => ({ ...prev, stats: false }))

      if (ordersRes.status === 'fulfilled') {
        setRecentOrders(ordersRes.value.data.data)
      }
      setLoading(prev => ({ ...prev, orders: false }))

      if (productsRes.status === 'fulfilled') {
        setBestProducts(productsRes.value.data.data)
      }
      setLoading(prev => ({ ...prev, products: false }))

      if (statusRes.status === 'fulfilled') {
        setOrderStatus(statusRes.value.data.data)
      }
      setLoading(prev => ({ ...prev, orderStatus: false }))

    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err)
      setError('데이터를 불러오는데 실패했습니다.')
      setLoading({ stats: false, orders: false, products: false, orderStatus: false })
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // 상태별 주문 관리 페이지로 이동 (필터 적용)
  const handleStatusClick = useCallback((status) => {
    // 주문 관리 탭으로 이동하면서 필터 상태 전달
    if (onNavigateToOrders) {
      onNavigateToOrders(status)
    }
  }, [onNavigateToOrders])

  // 기본 통계 데이터 (로딩 중 표시용)
  const defaultStats = [
    { id: 1, label: '총 매출', value: '-', change: '-', trend: 'up', period: '지난 달 대비' },
    { id: 2, label: '주문 수', value: '-', change: '-', trend: 'up', period: '지난 달 대비' },
    { id: 3, label: '신규 회원', value: '-', change: '-', trend: 'up', period: '지난 달 대비' },
    { id: 4, label: '평균 주문액', value: '-', change: '-', trend: 'up', period: '지난 달 대비' },
  ]

  const displayStats = stats.length > 0 ? stats : defaultStats

  return (
    <>
      {error && (
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={fetchDashboardData}>다시 시도</button>
        </div>
      )}

      {/* 통계 카드들 */}
      <section className="stats-section">
        {displayStats.map(stat => (
          <StatCard key={stat.id} stat={stat} loading={loading.stats} />
        ))}
      </section>

      {/* 주문 상태 현황 */}
      <OrderStatusSection 
        statusData={orderStatus}
        loading={loading.orderStatus}
        onStatusClick={handleStatusClick}
        onNavigateToOrders={() => onNavigateToOrders && onNavigateToOrders()}
      />

      {/* 하단 그리드 */}
      <div className="dashboard-grid">
        {/* 최근 주문 */}
        <section className="dashboard-card orders-card">
          <div className="card-header">
            <h2>최근 주문</h2>
            <button className="view-all-btn" onClick={() => onNavigateToOrders && onNavigateToOrders()}>전체보기</button>
          </div>
          <div className="orders-table-wrapper">
            {loading.orders ? (
              <LoadingSkeleton count={5} />
            ) : recentOrders.length === 0 ? (
              <div className="no-data">최근 주문이 없습니다.</div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>고객명</th>
                    <th>상품</th>
                    <th>금액</th>
                    <th>상태</th>
                    <th>날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="product-name">{order.product}</td>
                      <td className="amount">{order.amount}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="date">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 베스트 상품 */}
        <section className="dashboard-card best-products-card">
          <div className="card-header">
            <h2>베스트 상품</h2>
            <button className="view-all-btn" onClick={onNavigateToProducts}>전체보기</button>
          </div>
          <div className="best-products-list">
            {loading.products ? (
              <LoadingSkeleton count={5} />
            ) : bestProducts.length === 0 ? (
              <div className="no-data">판매 데이터가 없습니다.</div>
            ) : (
              bestProducts.map((product, index) => (
                <div key={product.id} className="best-product-item">
                  <span className="product-rank">{index + 1}</span>
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-sales">{product.sales}개 판매</span>
                  </div>
                  <span className="product-revenue">{product.revenue}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 빠른 액션 */}
      <section className="quick-actions">
        <h2>빠른 작업</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={onNavigateToProducts}>
            <ProductIcon />
            <span>새 상품 등록</span>
          </button>
          <button className="action-card" onClick={() => onNavigateToOrders && onNavigateToOrders()}>
            <OrderIcon />
            <span>주문 처리</span>
          </button>
          <button className="action-card" onClick={onNavigateToUsers}>
            <UserIcon />
            <span>회원 조회</span>
          </button>
          <button className="action-card" onClick={onNavigateToSettings}>
            <SettingsIcon />
            <span>사이트 설정</span>
          </button>
        </div>
      </section>
    </>
  )
}

export default memo(DashboardContent)
