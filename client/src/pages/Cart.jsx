import { useState, useCallback, memo, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import './Cart.css'

// 가격 포맷
const formatPrice = (price) => price?.toLocaleString() || '0'

// 장바구니 아이템 컴포넌트
const CartItem = memo(({ item, selected, onSelect, onQuantityChange, onRemove }) => {
  const product = item.product
  if (!product) return null

  return (
    <div className={`cart-item ${selected ? 'selected' : ''}`}>
      <div className="item-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(product._id)}
        />
      </div>
      
      <Link to={`/product/${product._id}`} className="item-image">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">NO IMAGE</div>
        )}
      </Link>

      <div className="item-info">
        <Link to={`/product/${product._id}`} className="item-name">
          {product.name}
        </Link>
        <span className="item-category">{product.category}</span>
        <span className="item-sku">SKU: {product.sku}</span>
      </div>

      <div className="item-quantity">
        <button 
          className="qty-btn"
          onClick={() => onQuantityChange(product._id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="qty-value">{item.quantity}</span>
        <button 
          className="qty-btn"
          onClick={() => onQuantityChange(product._id, item.quantity + 1)}
          disabled={item.quantity >= 99}
        >
          +
        </button>
      </div>

      <div className="item-price">
        <span className="unit-price">₩{formatPrice(product.price)}</span>
        <span className="total-price">₩{formatPrice(product.price * item.quantity)}</span>
      </div>

      <button 
        className="item-remove"
        onClick={() => onRemove(product._id)}
        aria-label="삭제"
      >
        ✕
      </button>
    </div>
  )
})

// 빈 장바구니 컴포넌트
const EmptyCart = memo(() => (
  <div className="empty-cart">
    <div className="empty-icon">🛒</div>
    <h2>장바구니가 비어있습니다</h2>
    <p>원하시는 상품을 장바구니에 담아보세요!</p>
    <Link to="/" className="btn-shop">쇼핑 계속하기</Link>
  </div>
))

// 로그인 필요 컴포넌트
const LoginRequired = memo(() => (
  <div className="login-required">
    <div className="login-icon">🔒</div>
    <h2>로그인이 필요합니다</h2>
    <p>장바구니를 이용하시려면 로그인해주세요.</p>
    <Link to="/login" className="btn-login">로그인하기</Link>
  </div>
))

function Cart() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { cart, loading, fetchCart, updateQuantity, removeFromCart, removeSelectedItems, clearCart } = useCart()
  const [selectedItems, setSelectedItems] = useState([])

  // 페이지 마운트 시 장바구니 새로고침
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  // 전체 선택 여부
  const allSelected = useMemo(() => {
    if (cart.items.length === 0) return false
    return cart.items.every(item => selectedItems.includes(item.product?._id))
  }, [cart.items, selectedItems])

  // 선택된 상품들의 총 금액
  const selectedTotal = useMemo(() => {
    return cart.items
      .filter(item => selectedItems.includes(item.product?._id))
      .reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0)
  }, [cart.items, selectedItems])

  // 개별 선택
  const handleSelect = useCallback((productId) => {
    setSelectedItems(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedItems([])
    } else {
      setSelectedItems(cart.items.map(item => item.product?._id).filter(Boolean))
    }
  }, [allSelected, cart.items])

  // 수량 변경
  const handleQuantityChange = useCallback(async (productId, quantity) => {
    try {
      await updateQuantity(productId, quantity)
    } catch (error) {
      alert(error.message)
    }
  }, [updateQuantity])

  // 개별 삭제
  const handleRemove = useCallback(async (productId) => {
    try {
      await removeFromCart(productId)
      setSelectedItems(prev => prev.filter(id => id !== productId))
    } catch (error) {
      alert(error.message)
    }
  }, [removeFromCart])

  // 선택 삭제
  const handleRemoveSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      alert('삭제할 상품을 선택해주세요.')
      return
    }
    
    if (window.confirm(`선택한 ${selectedItems.length}개 상품을 삭제하시겠습니까?`)) {
      try {
        await removeSelectedItems(selectedItems)
        setSelectedItems([])
      } catch (error) {
        alert(error.message)
      }
    }
  }, [selectedItems, removeSelectedItems])

  // 전체 삭제
  const handleClearCart = useCallback(async () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      try {
        await clearCart()
        setSelectedItems([])
      } catch (error) {
        alert(error.message)
      }
    }
  }, [clearCart])

  // 주문하기
  const handleOrder = useCallback(() => {
    if (selectedItems.length === 0) {
      alert('주문할 상품을 선택해주세요.')
      return
    }
    navigate('/checkout', { state: { selectedItems } })
  }, [selectedItems, navigate])

  // 로그인 필요
  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <LoginRequired />
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-container">
        <h1 className="cart-title">장바구니</h1>

        {loading ? (
          <div className="cart-loading">
            <p>장바구니를 불러오는 중...</p>
          </div>
        ) : cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="cart-content">
            {/* 장바구니 헤더 */}
            <div className="cart-header">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <span>전체 선택 ({selectedItems.length}/{cart.items.length})</span>
              </label>
              <div className="header-actions">
                <button className="btn-delete-selected" onClick={handleRemoveSelected}>
                  선택 삭제
                </button>
                <button className="btn-clear" onClick={handleClearCart}>
                  전체 삭제
                </button>
              </div>
            </div>

            {/* 장바구니 아이템 목록 */}
            <div className="cart-items">
              {cart.items.map(item => (
                <CartItem
                  key={item._id}
                  item={item}
                  selected={selectedItems.includes(item.product?._id)}
                  onSelect={handleSelect}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* 주문 요약 */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>선택 상품 금액 ({selectedItems.length}개)</span>
                <span>₩{formatPrice(selectedTotal)}</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span>{selectedTotal >= 50000 ? '무료' : selectedTotal > 0 ? '₩3,000' : '-'}</span>
              </div>
              <div className="summary-row total">
                <span>결제 예정 금액</span>
                <span>₩{formatPrice(selectedTotal > 0 ? selectedTotal + (selectedTotal >= 50000 ? 0 : 3000) : 0)}</span>
              </div>
              {selectedItems.length === 0 && cart.items.length > 0 && (
                <div className="summary-notice">
                  <span>상품을 선택해주세요</span>
                </div>
              )}
            </div>

            {/* 주문 버튼 */}
            <div className="cart-actions">
              <Link to="/" className="btn-continue">쇼핑 계속하기</Link>
              <button 
                className="btn-order"
                onClick={handleOrder}
                disabled={selectedItems.length === 0}
              >
                {selectedItems.length > 0 
                  ? `${selectedItems.length}개 상품 주문하기`
                  : '상품을 선택해주세요'
                }
              </button>
            </div>
          </div>
        )}
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

export default memo(Cart)


