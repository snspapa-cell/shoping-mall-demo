import { memo } from 'react'
import { 
  ProductIcon, 
  OrderIcon, 
  UserIcon, 
  SettingsIcon,
  TrendUpIcon,
  TrendDownIcon
} from '../icons/AdminIcons'
import { MOCK_STATS, MOCK_RECENT_ORDERS, MOCK_BEST_PRODUCTS } from '../../constants/adminData'

// 상태 배지 컴포넌트
const StatusBadge = memo(({ status }) => {
  const statusStyles = {
    '배송중': 'status-shipping',
    '결제완료': 'status-paid',
    '배송완료': 'status-delivered',
    '주문취소': 'status-cancelled',
  }
  return <span className={`status-badge ${statusStyles[status] || ''}`}>{status}</span>
})

// 통계 카드 컴포넌트
const StatCard = memo(({ stat }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-label">{stat.label}</span>
      <span className={`stat-change ${stat.trend}`}>
        {stat.trend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
        {stat.change}
      </span>
    </div>
    <div className="stat-value">{stat.value}</div>
    <div className="stat-period">{stat.period}</div>
  </div>
))

// 대시보드 컨텐츠 컴포넌트
function DashboardContent({ onNavigateToProducts }) {
  return (
    <>
      {/* 통계 카드들 */}
      <section className="stats-section">
        {MOCK_STATS.map(stat => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      {/* 하단 그리드 */}
      <div className="dashboard-grid">
        {/* 최근 주문 */}
        <section className="dashboard-card orders-card">
          <div className="card-header">
            <h2>최근 주문</h2>
            <button className="view-all-btn">전체보기</button>
          </div>
          <div className="orders-table-wrapper">
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
                {MOCK_RECENT_ORDERS.map(order => (
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
          </div>
        </section>

        {/* 베스트 상품 */}
        <section className="dashboard-card best-products-card">
          <div className="card-header">
            <h2>베스트 상품</h2>
            <button className="view-all-btn">전체보기</button>
          </div>
          <div className="best-products-list">
            {MOCK_BEST_PRODUCTS.map((product, index) => (
              <div key={product.id} className="best-product-item">
                <span className="product-rank">{index + 1}</span>
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-sales">{product.sales}개 판매</span>
                </div>
                <span className="product-revenue">{product.revenue}</span>
              </div>
            ))}
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
          <button className="action-card">
            <OrderIcon />
            <span>주문 처리</span>
          </button>
          <button className="action-card">
            <UserIcon />
            <span>회원 조회</span>
          </button>
          <button className="action-card">
            <SettingsIcon />
            <span>사이트 설정</span>
          </button>
        </div>
      </section>
    </>
  )
}

export default memo(DashboardContent)

