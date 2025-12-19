import { memo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartIcon, BagIcon } from './icons/Icons'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import './ProductCard.css'

// 가격 포맷 함수
const formatPrice = (price) => {
  return price?.toLocaleString() || '0'
}

// 태그 목록 (랜덤 또는 카테고리 기반)
const PRODUCT_TAGS = ['무료배송', '오늘출발', '당일발송', '특가세일', '인기상품']

const ProductCard = memo(function ProductCard({ product, variant = 'default', label = 'PRODUCT', index = 0 }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const placeholderClass = variant === 'weekly' ? 'weekly' : variant === 'new' ? 'new' : ''
  
  // 서버 데이터와 하드코딩 데이터 모두 지원
  const productImage = product.images?.[0] || null
  const productName = product.name || ''
  const productPrice = product.price || 0
  const productSalePrice = product.salePrice || product.price || 0
  const productDiscount = product.discount || 0
  const productRating = product.rating || 4.5
  const productReviews = product.reviews || Math.floor(Math.random() * 500) + 10
  const productLikes = product.likes || Math.floor(Math.random() * 200) + 5
  const productId = product._id || product.id
  const productBrand = product.brand || ''
  
  // 태그 결정 (카테고리 기반 또는 랜덤)
  const productTag = product.tag || PRODUCT_TAGS[index % PRODUCT_TAGS.length]

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
    
    setIsLiked(!isLiked)
  }, [isAuthenticated, navigate, isLiked])
  
  return (
    <div className="product-card-v2">
      <Link to={`/product/${productId}`} className="product-card-link">
        <div className="product-image-wrapper">
          {productImage ? (
            <img src={productImage} alt={productName} className="product-img" />
          ) : (
            <div className={`image-placeholder ${placeholderClass}`}>
              <span>{label}</span>
            </div>
          )}
          
          {/* 태그 배지 */}
          <div className="product-tags">
            <span className={`tag-badge ${variant === 'new' ? 'tag-new' : variant === 'weekly' ? 'tag-best' : 'tag-sale'}`}>
              {productTag}
            </span>
          </div>
          
          {/* 찜하기 버튼 */}
          <button 
            className={`wishlist-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleWishlist}
            aria-label="찜하기"
          >
            <HeartIcon filled={isLiked} />
          </button>
        </div>
        
        <div className="product-info-v2">
          {/* 할인율 + 가격 */}
          <div className="price-info">
            {productDiscount > 0 && (
              <span className="discount-percent">{productDiscount}%</span>
            )}
            <div className="price-wrapper">
              {productDiscount > 0 && (
                <span className="original-price">{formatPrice(productPrice)}</span>
              )}
              <span className="current-price">{formatPrice(productSalePrice)}</span>
            </div>
          </div>
          
          {/* 쿠폰 태그 */}
          {productDiscount > 0 && (
            <div className="coupon-badge-row">
              <span className="coupon-badge">쿠폰적용가</span>
            </div>
          )}
          
          {/* 브랜드 + 상품명 */}
          <p className="product-title">
            {productBrand && <span className="brand-name">{productBrand} - </span>}
            {productName}
          </p>
          
          {/* 리뷰 & 좋아요 */}
          <div className="product-stats">
            <span className="stat-reviews">
              <span className="stat-icon">💬</span>
              리뷰 {formatPrice(productReviews)}
            </span>
            <span className="stat-likes">
              <span className="stat-icon">♥</span>
              {formatPrice(productLikes)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
})

export default ProductCard
