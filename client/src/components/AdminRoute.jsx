import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // 인증 상태 로딩 중일 때 로딩 표시
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    )
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 관리자가 아닌 경우 홈으로 리다이렉트
  if (user?.user_type !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute

