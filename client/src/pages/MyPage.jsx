import { useState, useEffect, useCallback, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useOrder } from '../hooks/useOrder'
import api from '../utils/axios'
import './MyPage.css'

// 가격 포맷
const formatPrice = (price) => price?.toLocaleString() || '0'

// 날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 주문 상태 라벨
const STATUS_LABELS = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
  refunded: '환불됨',
}

// 탭 메뉴
const TABS = [
  { id: 'overview', label: '내 정보', path: null },
  { id: 'orders', label: '주문 내역', path: '/orders' },
  { id: 'addresses', label: '배송지 관리', path: null },
  { id: 'password', label: '비밀번호 변경', path: null },
]

// 내 정보 탭
const OverviewTab = memo(({ user, recentOrders, addressCount }) => (
  <div className="tab-content overview-tab">
    <div className="info-cards">
      {/* 회원 정보 카드 */}
      <div className="info-card">
        <h3>👤 회원 정보</h3>
        <div className="info-list">
          <div className="info-item">
            <span className="label">이름</span>
            <span className="value">{user?.username}</span>
          </div>
          <div className="info-item">
            <span className="label">이메일</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="info-item">
            <span className="label">회원등급</span>
            <span className="value">일반회원</span>
          </div>
          <div className="info-item">
            <span className="label">가입일</span>
            <span className="value">{formatDate(user?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 주문 현황 카드 */}
      <div className="info-card">
        <h3>📦 주문 현황</h3>
        <div className="order-stats">
          <div className="stat-item">
            <span className="stat-value">{recentOrders?.filter(o => o.status === 'paid').length || 0}</span>
            <span className="stat-label">결제완료</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentOrders?.filter(o => o.status === 'preparing').length || 0}</span>
            <span className="stat-label">상품준비</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentOrders?.filter(o => o.status === 'shipped').length || 0}</span>
            <span className="stat-label">배송중</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentOrders?.filter(o => o.status === 'delivered').length || 0}</span>
            <span className="stat-label">배송완료</span>
          </div>
        </div>
      </div>

      {/* 배송지 카드 */}
      <div className="info-card">
        <h3>📍 배송지</h3>
        <p className="info-text">등록된 배송지: <strong>{addressCount}개</strong></p>
        <Link to="#" className="card-link" onClick={(e) => { e.preventDefault() }}>배송지 관리 →</Link>
      </div>
    </div>

    {/* 최근 주문 */}
    <div className="recent-orders">
      <div className="section-header">
        <h3>최근 주문</h3>
        <Link to="/orders" className="view-all">전체보기 →</Link>
      </div>
      
      {recentOrders && recentOrders.length > 0 ? (
        <div className="orders-list">
          {recentOrders.slice(0, 3).map((order) => (
            <div key={order._id} className="order-item">
              <div className="order-header">
                <span className="order-number">{order.orderNumber}</span>
                <span className={`order-status status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="order-body">
                <div className="order-products">
                  {order.items?.slice(0, 2).map((item, idx) => (
                    <span key={idx} className="product-name">{item.name}</span>
                  ))}
                  {order.items?.length > 2 && (
                    <span className="more-products">외 {order.items.length - 2}건</span>
                  )}
                </div>
                <div className="order-info">
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                  <span className="order-price">₩{formatPrice(order.pricing?.totalPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-orders">
          <p>주문 내역이 없습니다.</p>
          <Link to="/" className="btn-shop">쇼핑하러 가기</Link>
        </div>
      )}
    </div>
  </div>
))


// 배송지 관리 탭
const AddressesTab = memo(({ addresses, onAdd, onEdit, onDelete, onSetDefault }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    recipientName: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    isDefault: false,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      recipientName: '',
      phone: '',
      zipCode: '',
      address: '',
      addressDetail: '',
      isDefault: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (addr) => {
    setFormData({
      name: addr.name || '',
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      zipCode: addr.zipCode || '',
      address: addr.address || '',
      addressDetail: addr.addressDetail || '',
      isDefault: addr.isDefault || false,
    })
    setEditingId(addr._id)
    setShowForm(true)
  }

  const handleSearchAddress = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러올 수 없습니다.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        }))
      },
    }).open()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.recipientName || !formData.phone || !formData.zipCode || !formData.address) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    try {
      if (editingId) {
        await onEdit(editingId, formData)
      } else {
        await onAdd(formData)
      }
      resetForm()
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="tab-content addresses-tab">
      <div className="section-header">
        <h3>배송지 관리</h3>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + 새 배송지 추가
          </button>
        )}
      </div>

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <h4>{editingId ? '배송지 수정' : '새 배송지 추가'}</h4>
          
          <div className="form-group">
            <label>배송지명</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 집, 회사"
            />
          </div>

          <div className="form-group">
            <label>수령인 *</label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
              placeholder="수령인 이름"
              required
            />
          </div>

          <div className="form-group">
            <label>연락처 *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="'-' 없이 입력"
              required
            />
          </div>

          <div className="form-group">
            <label>우편번호 *</label>
            <div className="zipcode-input">
              <input
                type="text"
                value={formData.zipCode}
                readOnly
                placeholder="우편번호"
                required
              />
              <button type="button" onClick={handleSearchAddress}>주소 검색</button>
            </div>
          </div>

          <div className="form-group">
            <label>기본주소 *</label>
            <input
              type="text"
              value={formData.address}
              readOnly
              placeholder="주소 검색을 이용해주세요"
              required
            />
          </div>

          <div className="form-group">
            <label>상세주소</label>
            <input
              type="text"
              value={formData.addressDetail}
              onChange={(e) => setFormData(prev => ({ ...prev, addressDetail: e.target.value }))}
              placeholder="상세주소 입력"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              기본 배송지로 설정
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={resetForm}>취소</button>
            <button type="submit" className="btn-save">저장</button>
          </div>
        </form>
      )}

      <div className="addresses-list">
        {addresses && addresses.length > 0 ? (
          addresses.map((addr) => (
            <div key={addr._id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
              <div className="address-header">
                <span className="address-name">{addr.name || '배송지'}</span>
                {addr.isDefault && <span className="default-badge">기본</span>}
              </div>
              <div className="address-body">
                <p className="recipient">{addr.recipientName} / {addr.phone}</p>
                <p className="address">({addr.zipCode}) {addr.address} {addr.addressDetail}</p>
              </div>
              <div className="address-actions">
                {!addr.isDefault && (
                  <button onClick={() => onSetDefault(addr._id)}>기본으로 설정</button>
                )}
                <button onClick={() => handleEdit(addr)}>수정</button>
                <button onClick={() => onDelete(addr._id)}>삭제</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-addresses">
            <p>등록된 배송지가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
})

// 비밀번호 변경 탭
const PasswordTab = memo(({ onChangePassword }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      await onChangePassword(formData.currentPassword, formData.newPassword)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('비밀번호가 변경되었습니다.')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content password-tab">
      <h3>비밀번호 변경</h3>
      
      <form className="password-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>현재 비밀번호</label>
          <input
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="현재 비밀번호 입력"
            required
          />
        </div>

        <div className="form-group">
          <label>새 비밀번호</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            placeholder="새 비밀번호 입력 (최소 6자)"
            required
          />
        </div>

        <div className="form-group">
          <label>새 비밀번호 확인</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="새 비밀번호 다시 입력"
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>

      <div className="password-notice">
        <h4>비밀번호 변경 시 주의사항</h4>
        <ul>
          <li>비밀번호는 최소 6자 이상으로 설정해주세요.</li>
          <li>영문, 숫자를 조합하면 더욱 안전합니다.</li>
          <li>변경 후 다시 로그인해야 합니다.</li>
        </ul>
      </div>
    </div>
  )
})

function MyPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { getMyOrders } = useOrder()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/mypage' } })
    }
  }, [isAuthenticated, navigate])

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return
      
      setLoading(true)
      try {
        // 주문 내역 조회
        const ordersResult = await getMyOrders()
        if (ordersResult.success) {
          setOrders(ordersResult.data || [])
        }

        // 배송지 목록 조회
        const addressesResponse = await api.get('/shipping-addresses')
        setAddresses(addressesResponse.data.data || [])
      } catch (error) {
        console.error('데이터 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, getMyOrders])

  // 배송지 추가
  const handleAddAddress = useCallback(async (addressData) => {
    const response = await api.post('/shipping-addresses', addressData)
    setAddresses(response.data.data)
  }, [])

  // 배송지 수정
  const handleEditAddress = useCallback(async (id, addressData) => {
    const response = await api.put(`/shipping-addresses/${id}`, addressData)
    setAddresses(response.data.data)
  }, [])

  // 배송지 삭제
  const handleDeleteAddress = useCallback(async (id) => {
    if (!window.confirm('이 배송지를 삭제하시겠습니까?')) return
    
    const response = await api.delete(`/shipping-addresses/${id}`)
    setAddresses(response.data.data)
  }, [])

  // 기본 배송지 설정
  const handleSetDefaultAddress = useCallback(async (id) => {
    const response = await api.patch(`/shipping-addresses/${id}/default`)
    setAddresses(response.data.data)
  }, [])

  // 비밀번호 변경
  const handleChangePassword = useCallback(async (currentPassword, newPassword) => {
    await api.put('/auth/password', { currentPassword, newPassword })
    logout()
    navigate('/login')
  }, [logout, navigate])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="mypage">
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
          <aside className="mypage-sidebar">
            <nav className="mypage-nav">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    if (tab.path) {
                      navigate(tab.path)
                    } else {
                      setActiveTab(tab.id)
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* 메인 컨텐츠 */}
          <main className="mypage-main">
            {activeTab === 'overview' && (
              <OverviewTab
                user={user}
                recentOrders={orders}
                addressCount={addresses.length}
              />
            )}
            
            {/* 주문 내역은 /orders 페이지로 이동 */}
            
            {activeTab === 'addresses' && (
              <AddressesTab
                addresses={addresses}
                onAdd={handleAddAddress}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefaultAddress}
              />
            )}
            
            {activeTab === 'password' && (
              <PasswordTab onChangePassword={handleChangePassword} />
            )}
          </main>
        </div>
      </div>

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

export default memo(MyPage)

