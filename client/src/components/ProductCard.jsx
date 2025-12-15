import { memo } from 'react'
import { HeartIcon, BagIcon } from './icons/Icons'

// 가격 포맷 함수
const formatPrice = (price) => {
  return price?.toLocaleString() || '0'
}

const ProductCard = memo(function ProductCard({ product, variant = 'default', label = 'PRODUCT' }) {
  const placeholderClass = variant === 'weekly' ? 'weekly' : variant === 'new' ? 'new' : ''
  
  // 서버 데이터와 하드코딩 데이터 모두 지원
  const productImage = product.images?.[0] || null
  const productName = product.name || ''
  const productPrice = product.price || 0
  const productSalePrice = product.salePrice || product.price || 0
  const productDiscount = product.discount || 0
  const productRating = product.rating || 4.5
  const productReviews = product.reviews || 0
  const productId = product._id || product.id
  
  return (
    <div className="product-card">
      <div className="product-image">
        {productImage ? (
          <img src={productImage} alt={productName} className="product-img" />
        ) : (
          <div className={`image-placeholder ${placeholderClass}`}>
            <span>{label}</span>
          </div>
        )}
        {productDiscount > 0 && (
          <span className="discount-badge">{productDiscount}%</span>
        )}
        <div className="product-actions">
          <button className="action-btn heart" aria-label="좋아요">
            <HeartIcon />
          </button>
          <button className="action-btn cart" aria-label="장바구니">
            <BagIcon size={18} />
          </button>
        </div>
      </div>
      <div className="product-info">
        <div className="price-row">
          {productDiscount > 0 && (
            <>
              <span className="discount-rate">{productDiscount}%</span>
              <span className="original-price">{formatPrice(productPrice)}</span>
            </>
          )}
          <span className="sale-price">{formatPrice(productSalePrice)}</span>
        </div>
        {productDiscount > 0 && (
          <div className="coupon-price">
            <span className="coupon-tag">쿠폰적용가</span>
          </div>
        )}
        <p className="product-name">{productName}</p>
        {productReviews > 0 && (
          <div className="product-meta">
            <span className="stars">★★★★★</span>
            <span className="rating-score">{productRating}</span>
            <span className="reviews">리뷰 {formatPrice(productReviews)}</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default ProductCard
