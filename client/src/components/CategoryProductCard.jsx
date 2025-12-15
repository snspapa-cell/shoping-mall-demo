import { memo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartIcon, BagIcon } from './icons/Icons'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import './CategoryProductCard.css'

// 가격 포맷 함수
const formatPrice = (price) => {
  return price?.toLocaleString() || '0'
}

function CategoryProductCard({ product }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const productImage = product.images?.[0] || null
  const productName = product.name || ''
  const productPrice = product.price || 0
  const productId = product._id || product.id

  // 장바구니 추가 핸들러
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    if (!productId) return

    setIsAdding(true)
    try {
      await addToCart(productId, 1)
      alert('장바구니에 추가되었습니다.')
    } catch (error) {
      alert(error.message)
    } finally {
      setIsAdding(false)
    }
  }, [isAuthenticated, productId, addToCart, navigate])

  // 찜하기 핸들러
  const handleWishlist = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }
    
    alert('찜하기 기능은 준비 중입니다.')
  }, [isAuthenticated, navigate])

  return (
    <div className="category-product-card">
      <Link to={`/product/${productId}`} className="product-link">
        <div className="product-image-wrapper">
          {productImage ? (
            <img src={productImage} alt={productName} className="product-image" />
          ) : (
            <div className="product-placeholder">
              <span>NO IMAGE</span>
            </div>
          )}
          <div className="product-overlay">
            <button 
              className="overlay-btn" 
              aria-label="좋아요"
              onClick={handleWishlist}
            >
              <HeartIcon />
            </button>
            <button 
              className="overlay-btn" 
              aria-label="장바구니"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <BagIcon size={20} />
            </button>
          </div>
        </div>
        <div className="product-details">
          <p className="product-name">{productName}</p>
          <p className="product-price">₩{formatPrice(productPrice)}</p>
          {product.category && (
            <span className="product-category-badge">{product.category}</span>
          )}
        </div>
      </Link>
    </div>
  )
}

export default memo(CategoryProductCard)
