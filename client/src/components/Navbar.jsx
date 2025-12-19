import { memo, useCallback, useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useCart } from '../hooks/useCart.jsx'
import { SearchIcon, BagIcon } from './icons/Icons'
import './Navbar.css'

const CATEGORIES = [
  'BEST', '겨울신상', '패딩', 'MADE', '오늘의특가', '아우터', 
  '원피스', '니트', '티셔츠', '팬츠', '스커트', '악세서리'
]

function Navbar({ topBannerText = "성찬 쇼핑몰에서 고민하지마세요! 사이즈 무료 교환" }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { cart } = useCart()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = useCallback(() => {
    logout()
    setIsDropdownOpen(false)
    navigate('/')
  }, [logout, navigate])

  // 장바구니 아이템 개수
  const cartItemCount = cart?.totalItems || 0

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 메뉴 항목 클릭 시 드롭다운 닫기
  const handleMenuClick = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

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
              <div className="user-dropdown" ref={dropdownRef}>
                <button className="dropdown-trigger" onClick={toggleDropdown}>
                  <span className="user-name">{user?.username}님</span>
                  <svg 
                    className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/mypage" className="dropdown-item" onClick={handleMenuClick}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      마이페이지
                    </Link>
                    <Link to="/orders" className="dropdown-item" onClick={handleMenuClick}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      주문내역
                    </Link>
                    {user?.user_type === 'admin' && (
                      <>
                        <div className="dropdown-divider"></div>
                        <Link to="/admin" className="dropdown-item admin" onClick={handleMenuClick}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                          </svg>
                          관리자 페이지
                        </Link>
                      </>
                    )}
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-btn">로그인</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default memo(Navbar)
