import { useState, useEffect, useCallback, memo } from 'react'
import api from '../../utils/axios'
import './UsersContent.css'

// 회원 유형 표시
const USER_TYPE_MAP = {
  customer: { label: '일반회원', class: 'type-customer' },
  admin: { label: '관리자', class: 'type-admin' },
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

// 회원 유형 배지
const UserTypeBadge = memo(({ type }) => {
  const typeInfo = USER_TYPE_MAP[type] || { label: type, class: '' }
  return <span className={`user-type-badge ${typeInfo.class}`}>{typeInfo.label}</span>
})

// 통계 카드 컴포넌트
const StatCard = memo(({ label, value, subLabel, subValue }) => (
  <div className="user-stat-card">
    <div className="stat-main">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
    {subLabel && (
      <div className="stat-sub">
        <span>{subLabel}: {subValue}</span>
      </div>
    )}
  </div>
))

// 회원 상세/수정 모달
const UserDetailModal = memo(({ user, onClose, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    user_type: user.user_type || 'customer',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdate(user._id, formData)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`정말 "${user.username}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    setLoading(true)
    try {
      await onDelete(user._id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>회원 정보</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 회원 기본 정보 */}
          <section className="detail-section">
            <h3>기본 정보</h3>
            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>사용자명</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>회원 유형</label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
              >
                <option value="customer">일반회원</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </section>

          {/* 가입 정보 */}
          <section className="detail-section">
            <h3>가입 정보</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">가입일</span>
                <span className="value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="label">최근 수정일</span>
                <span className="value">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </section>

          {/* 배송지 정보 */}
          {user.shippingAddresses && user.shippingAddresses.length > 0 && (
            <section className="detail-section">
              <h3>배송지 목록 ({user.shippingAddresses.length}개)</h3>
              <div className="shipping-list">
                {user.shippingAddresses.map((addr, index) => (
                  <div key={addr._id || index} className={`shipping-item ${addr.isDefault ? 'default' : ''}`}>
                    <div className="shipping-header">
                      <span className="shipping-name">{addr.name || '배송지'}</span>
                      {addr.isDefault && <span className="default-badge">기본</span>}
                    </div>
                    <p>{addr.recipientName} / {addr.phone}</p>
                    <p>({addr.zipCode}) {addr.address} {addr.addressDetail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 버튼 */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-delete"
              onClick={handleDelete}
              disabled={loading}
            >
              회원 삭제
            </button>
            <div className="right-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
})

// 메인 회원 관리 컴포넌트
function UsersContent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [stats, setStats] = useState(null)
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // 페이지네이션
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  // 회원 통계 조회
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/users/stats')
      setStats(response.data.data)
    } catch (err) {
      console.error('회원 통계 조회 실패:', err)
    }
  }, [])

  // 회원 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ page, limit: 20, sortBy, sortOrder })
      if (searchTerm) params.append('search', searchTerm)
      if (userTypeFilter) params.append('user_type', userTypeFilter)

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data || [])
      setPagination(response.data.pagination || { total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || '회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, userTypeFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // 회원 정보 수정
  const handleUpdateUser = async (userId, updateData) => {
    try {
      await api.put(`/users/${userId}`, updateData)
      alert('회원 정보가 수정되었습니다.')
      fetchUsers()
      fetchStats()
      setSelectedUser(null)
    } catch (err) {
      alert(err.response?.data?.message || '회원 정보 수정에 실패했습니다.')
    }
  }

  // 회원 삭제
  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`)
      alert('회원이 삭제되었습니다.')
      fetchUsers()
      fetchStats()
    } catch (err) {
      alert(err.response?.data?.message || '회원 삭제에 실패했습니다.')
    }
  }

  // 검색
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  // 필터 초기화
  const handleResetFilter = () => {
    setSearchTerm('')
    setUserTypeFilter('')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  // 정렬 변경
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  if (error) {
    return (
      <div className="users-error">
        <p>{error}</p>
        <button onClick={fetchUsers}>다시 시도</button>
      </div>
    )
  }

  return (
    <div className="users-content">
      {/* 통계 카드 */}
      {stats && (
        <div className="users-stats-grid">
          <StatCard 
            label="전체 회원" 
            value={stats.totalUsers.toLocaleString()} 
          />
          <StatCard 
            label="이번 달 가입" 
            value={stats.thisMonthUsers.toLocaleString()}
            subLabel="지난 달"
            subValue={stats.lastMonthUsers.toLocaleString()}
          />
          <StatCard 
            label="오늘 가입" 
            value={stats.todayUsers.toLocaleString()}
          />
          <StatCard 
            label="관리자" 
            value={stats.adminCount.toLocaleString()}
            subLabel="일반회원"
            subValue={stats.customerCount.toLocaleString()}
          />
        </div>
      )}

      {/* 필터 영역 */}
      <div className="users-filter">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label>회원 유형</label>
              <select 
                value={userTypeFilter} 
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                <option value="">전체</option>
                <option value="customer">일반회원</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <label>검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이메일, 사용자명 검색"
              />
            </div>

            <div className="filter-actions">
              <button type="submit" className="btn-search">검색</button>
              <button type="button" className="btn-reset" onClick={handleResetFilter}>초기화</button>
            </div>
          </div>
        </form>
      </div>

      {/* 회원 목록 테이블 */}
      <div className="users-table-wrapper">
        {loading ? (
          <div className="loading">회원 목록을 불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="empty-users">회원이 없습니다.</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th 
                  className={`sortable ${sortBy === 'email' ? 'active' : ''}`}
                  onClick={() => handleSort('email')}
                >
                  이메일 {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={`sortable ${sortBy === 'username' ? 'active' : ''}`}
                  onClick={() => handleSort('username')}
                >
                  사용자명 {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>유형</th>
                <th>배송지</th>
                <th 
                  className={`sortable ${sortBy === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSort('createdAt')}
                >
                  가입일 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="user-email">{user.email}</td>
                  <td className="user-name">{user.username}</td>
                  <td>
                    <UserTypeBadge type={user.user_type} />
                  </td>
                  <td className="user-addresses">
                    {user.shippingAddresses?.length || 0}개
                  </td>
                  <td className="user-date">{formatDate(user.createdAt)}</td>
                  <td className="user-actions">
                    <button 
                      className="btn-detail"
                      onClick={() => setSelectedUser(user)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="users-pagination">
          <button 
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            이전
          </button>
          <span className="page-info">
            {page} / {pagination.totalPages} (총 {pagination.total}명)
          </span>
          <button 
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            다음
          </button>
        </div>
      )}

      {/* 회원 상세 모달 */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  )
}

export default memo(UsersContent)

