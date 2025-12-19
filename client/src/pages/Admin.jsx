import { useState, useCallback, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { HomeIcon, LogoutIcon } from '../components/icons/AdminIcons'
import { MENU_ITEMS, PAGE_TITLES } from '../constants/adminData'
import DashboardContent from '../components/admin/DashboardContent'
import ProductsContent from '../components/admin/ProductsContent'
import BannersContent from '../components/admin/BannersContent'
import LookbooksContent from '../components/admin/LookbooksContent'
import OrdersContent from '../components/admin/OrdersContent'
import UsersContent from '../components/admin/UsersContent'
import SettingsContent from '../components/admin/SettingsContent'
import './Admin.css'

// 사이드바 컴포넌트
const Sidebar = memo(({ activeMenu, onMenuChange, onLogout }) => (
  <aside className="admin-sidebar">
    <div className="sidebar-header">
      <Link to="/" className="admin-logo">성찬몰</Link>
      <span className="admin-badge">Admin</span>
    </div>

    <nav className="sidebar-nav">
      <ul className="nav-list">
        {MENU_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => onMenuChange(item.id)}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>

    <div className="sidebar-footer">
      <Link to="/" className="sidebar-link">
        <HomeIcon />
        <span>쇼핑몰로 이동</span>
      </Link>
      <button className="sidebar-link logout" onClick={onLogout}>
        <LogoutIcon />
        <span>로그아웃</span>
      </button>
    </div>
  </aside>
))

// 헤더 컴포넌트
const Header = memo(({ title, subtitle, user }) => (
  <header className="admin-header">
    <div className="header-title">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    <div className="header-user">
      <div className="user-avatar">{user?.username?.charAt(0) || 'A'}</div>
      <div className="user-info">
        <span className="user-name">{user?.username || '관리자'}</span>
        <span className="user-role">Administrator</span>
      </div>
    </div>
  </header>
))

// 메인 Admin 컴포넌트
function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleMenuChange = useCallback((menuId) => {
    setActiveMenu(menuId)
    // 메뉴 변경 시 필터 초기화
    if (menuId !== 'orders') {
      setOrderStatusFilter('')
    }
  }, [])

  const handleNavigateToProducts = useCallback(() => {
    setActiveMenu('products')
  }, [])

  const handleNavigateToOrders = useCallback((statusFilter = '') => {
    setOrderStatusFilter(statusFilter)
    setActiveMenu('orders')
  }, [])

  const handleNavigateToUsers = useCallback(() => {
    setActiveMenu('users')
  }, [])

  const handleNavigateToSettings = useCallback(() => {
    setActiveMenu('settings')
  }, [])

  // 콘텐츠 렌더링
  const renderContent = () => {
    switch (activeMenu) {
      case 'banners':
        return <BannersContent />
      case 'lookbooks':
        return <LookbooksContent />
      case 'products':
        return <ProductsContent />
      case 'orders':
        return <OrdersContent initialStatusFilter={orderStatusFilter} />
      case 'users':
        return <UsersContent />
      case 'settings':
        return <SettingsContent />
      default:
        return <DashboardContent 
          onNavigateToProducts={handleNavigateToProducts} 
          onNavigateToOrders={handleNavigateToOrders} 
          onNavigateToUsers={handleNavigateToUsers}
          onNavigateToSettings={handleNavigateToSettings}
        />
    }
  }

  const pageInfo = PAGE_TITLES[activeMenu] || PAGE_TITLES.dashboard

  return (
    <div className="admin-page">
      <Sidebar 
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        <Header 
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          user={user}
        />

        <div className="admin-content">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default Admin
