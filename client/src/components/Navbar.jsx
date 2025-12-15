import { memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useCart } from '../hooks/useCart.jsx'
import { SearchIcon, BagIcon } from './icons/Icons'
import './Navbar.css'

const CATEGORIES = [
  'BEST', '겨울신상', '패딩', 'MADE', '오늘의특가', '아우터', 
  '원피스', '니트', '티셔츠', '팬츠', '스커트', '악세서리'
]

function Navbar({ topBannerText = "성찬 쇼핑몰에서 고민하지마세요! 사이즈 무료 교환" }) {
  const { user, isAuthenticated, logout } = useAuth()
  const { cart } = useCart()

  const handleLogout = useCallback(() => logout(), [logout])

  // 장바구니 아이템 개수
  const cartItemCount = cart?.totalItems || 0

  return (
    <>
      {/* 상단 띠 배너 */}
      <div className="top-banner">
        <p>{topBannerText}</p>
      </div>

      {/* 네비게이션 바 */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">성찬몰</Link>

          <ul className="nav-menu">
            {CATEGORIES.map((cat, index) => (
              <li key={index}>
                <Link to={`/category/${encodeURIComponent(cat)}`} className="nav-link">{cat}</Link>
              </li>
            ))}
          </ul>

          <div className="nav-icons">
            <button className="icon-btn" aria-label="검색"><SearchIcon /></button>
            
            <Link to="/cart" className="icon-btn cart-icon" aria-label="장바구니">
              <BagIcon />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="welcome-text">{user?.username}님 환영합니다</span>
                <button className="text-btn" onClick={handleLogout}>로그아웃</button>
              </div>
            ) : (
              <Link to="/login" className="text-btn">로그인</Link>
            )}

            {isAuthenticated && user?.user_type === 'admin' && (
              <Link to="/admin" className="admin-btn">관리자</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default memo(Navbar)
