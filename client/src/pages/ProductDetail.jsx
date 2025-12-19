import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/axios'
import './ProductDetail.css'

// 날짜 포맷 함수
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 가격 포맷 함수
const formatPrice = (price) => {
  return price?.toLocaleString() || '0'
}

// 이미지 갤러리 컴포넌트
const ImageGallery = memo(({ images, productName }) => {
  const [mainImage, setMainImage] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="product-gallery">
        <div className="main-image no-image">
          <span>NO IMAGE</span>
        </div>
      </div>
    )
  }

  return (
    <div className="product-gallery">
      <div className="main-image">
        <img src={images[mainImage]} alt={productName} />
      </div>
      {images.length > 1 && (
        <div className="thumbnail-list">
          {images.map((img, index) => (
            <button
              key={index}
              className={`thumbnail ${mainImage === index ? 'active' : ''}`}
              onClick={() => setMainImage(index)}
            >
              <img src={img} alt={`${productName} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

// 수량 선택 컴포넌트
const QuantitySelector = memo(({ quantity, onChange }) => (
  <div className="quantity-selector">
    <button 
      className="qty-btn" 
      onClick={() => onChange(Math.max(1, quantity - 1))}
      disabled={quantity <= 1}
    >
      -
    </button>
    <span className="qty-value">{quantity}</span>
    <button 
      className="qty-btn" 
      onClick={() => onChange(quantity + 1)}
    >
      +
    </button>
  </div>
))

// 상품 정보 컴포넌트
const ProductInfo = memo(({ product, quantity, onQuantityChange, onAddToCart, onBuyNow }) => (
  <div className="product-info-section">
    {/* 카테고리 & SKU */}
    <div className="product-meta-top">
      <span className="product-category-tag">{product.category}</span>
      <span className="product-sku">SKU: {product.sku}</span>
    </div>

    {/* 상품명 */}
    <h1 className="product-title">{product.name}</h1>

    {/* 가격 */}
    <div className="product-price-section">
      <span className="current-price">₩{formatPrice(product.price)}</span>
    </div>

    {/* 배송 정보 */}
    <div className="delivery-info">
      <div className="info-row">
        <span className="info-label">배송비</span>
        <span className="info-value">3,000원 (50,000원 이상 무료배송)</span>
      </div>
      <div className="info-row">
        <span className="info-label">배송예정</span>
        <span className="info-value">오늘 출발 시 내일 도착 예정</span>
      </div>
    </div>

    {/* 수량 선택 */}
    <div className="quantity-section">
      <span className="section-label">수량</span>
      <QuantitySelector quantity={quantity} onChange={onQuantityChange} />
      <span className="total-price">
        총 상품금액: <strong>₩{formatPrice(product.price * quantity)}</strong>
      </span>
    </div>

    {/* 구매 버튼 */}
    <div className="purchase-buttons">
      <button className="btn-cart" onClick={onAddToCart}>
        장바구니
      </button>
      <button className="btn-buy" onClick={onBuyNow}>
        바로구매
      </button>
    </div>

    {/* 찜하기 & 공유 */}
    <div className="sub-actions">
      <button className="sub-action-btn">
        <HeartIcon /> 찜하기
      </button>
      <button className="sub-action-btn">
        <ShareIcon /> 공유하기
      </button>
    </div>
  </div>
))

// 아이콘 컴포넌트
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

// 별점 표시 컴포넌트
const StarRating = memo(({ rating, size = 16, interactive = false, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0)

  const handleClick = (star) => {
    if (interactive && onRatingChange) {
      onRatingChange(star)
    }
  }

  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  )
})

// 리뷰 아이템 컴포넌트
const ReviewItem = memo(({ review, currentUserId, onHelpful, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLongContent = review.content.length > 200
  const displayContent = isLongContent && !isExpanded 
    ? review.content.slice(0, 200) + '...' 
    : review.content
  
  const isHelpful = review.helpfulUsers?.includes(currentUserId)
  const isOwner = review.user?._id === currentUserId

  return (
    <div className="review-item">
      <div className="review-header">
        <div className="review-user-info">
          <StarRating rating={review.rating} size={14} />
          <span className="review-author">
            {review.user?.name ? review.user.name.slice(0, 1) + '***' : '익명'}
          </span>
          {review.isVerifiedPurchase && (
            <span className="verified-badge">구매인증</span>
          )}
        </div>
        <span className="review-date">{formatDate(review.createdAt)}</span>
      </div>

      {review.title && <h4 className="review-title">{review.title}</h4>}
      
      <p className="review-content">{displayContent}</p>
      
      {isLongContent && (
        <button 
          className="btn-expand"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '접기' : '더보기'}
        </button>
      )}

      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((img, index) => (
            <img key={index} src={img} alt={`리뷰 이미지 ${index + 1}`} />
          ))}
        </div>
      )}

      {review.adminReply?.content && (
        <div className="admin-reply">
          <div className="reply-header">
            <span className="reply-badge">판매자 답변</span>
            <span className="reply-date">{formatDate(review.adminReply.repliedAt)}</span>
          </div>
          <p className="reply-content">{review.adminReply.content}</p>
        </div>
      )}

      <div className="review-actions">
        <button 
          className={`btn-helpful ${isHelpful ? 'active' : ''}`}
          onClick={() => onHelpful(review._id)}
          disabled={isOwner}
        >
          👍 도움이 됐어요 ({review.helpfulCount || 0})
        </button>
        {isOwner && (
          <button 
            className="btn-delete-review"
            onClick={() => onDelete(review._id)}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  )
})

// 리뷰 작성 폼 컴포넌트
const ReviewForm = memo(({ productId, orderId, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (content.length < 10) {
      alert('리뷰는 최소 10자 이상 작성해주세요.')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({ productId, orderId, rating, title, content })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>별점</label>
        <StarRating rating={rating} size={24} interactive onRatingChange={setRating} />
      </div>
      <div className="form-group">
        <label>제목 (선택)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="리뷰 제목을 입력하세요"
          maxLength={100}
        />
      </div>
      <div className="form-group">
        <label>내용 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="상품에 대한 솔직한 리뷰를 작성해주세요 (최소 10자)"
          rows={5}
          maxLength={1000}
          required
        />
        <span className="char-count">{content.length} / 1000</span>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 중...' : '리뷰 등록'}
        </button>
      </div>
    </form>
  )
})

// 리뷰 섹션 컴포넌트
const ReviewSection = memo(({ productId }) => {
  const { isAuthenticated, user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sort, setSort] = useState('newest')
  const [showWriteForm, setShowWriteForm] = useState(false)
  const [writableOrders, setWritableOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

  // 리뷰 목록 로드
  const fetchReviews = useCallback(async (pageNum = 1, sortType = sort) => {
    try {
      setLoading(true)
      const response = await api.get(`/reviews/product/${productId}?page=${pageNum}&limit=10&sort=${sortType}`)
      const data = response.data.data
      
      if (pageNum === 1) {
        setReviews(data.reviews)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }
      setStats(data.stats)
      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('리뷰 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [productId, sort])

  // 리뷰 작성 가능한 주문 확인
  const checkWritableOrders = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await api.get('/reviews/writable')
      const writable = response.data.data.filter(item => item.productId.toString() === productId)
      setWritableOrders(writable)
    } catch (error) {
      console.error('작성 가능 리뷰 확인 실패:', error)
    }
  }, [isAuthenticated, productId])

  useEffect(() => {
    fetchReviews(1, sort)
    checkWritableOrders()
  }, [fetchReviews, checkWritableOrders, sort])

  // 정렬 변경
  const handleSortChange = (newSort) => {
    setSort(newSort)
    fetchReviews(1, newSort)
  }

  // 더 보기
  const handleLoadMore = () => {
    fetchReviews(page + 1, sort)
  }

  // 리뷰 작성
  const handleSubmitReview = async (reviewData) => {
    try {
      await api.post('/reviews', reviewData)
      alert('리뷰가 등록되었습니다!')
      setShowWriteForm(false)
      setSelectedOrder(null)
      fetchReviews(1, sort)
      checkWritableOrders()
    } catch (error) {
      alert(error.response?.data?.message || '리뷰 등록에 실패했습니다.')
    }
  }

  // 도움됨 토글
  const handleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.')
      return
    }
    try {
      await api.post(`/reviews/${reviewId}/helpful`)
      fetchReviews(page, sort)
    } catch (error) {
      alert(error.response?.data?.message || '처리에 실패했습니다.')
    }
  }

  // 리뷰 삭제
  const handleDelete = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      alert('리뷰가 삭제되었습니다.')
      fetchReviews(1, sort)
      checkWritableOrders()
    } catch (error) {
      alert(error.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  // 평점 분포 계산
  const ratingBars = useMemo(() => {
    if (!stats?.ratingCounts) return []
    const total = stats.totalReviews || 1
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: stats.ratingCounts[rating] || 0,
      percentage: ((stats.ratingCounts[rating] || 0) / total) * 100
    }))
  }, [stats])

  return (
    <div className="review-section-v2">
      {/* 리뷰 요약 */}
      <div className="review-summary-v2">
        <div className="summary-left">
          <div className="average-rating">
            <span className="rating-number">{stats?.averageRating || 0}</span>
            <StarRating rating={stats?.averageRating || 0} size={20} />
          </div>
          <span className="total-reviews">{stats?.totalReviews || 0}개의 리뷰</span>
        </div>
        <div className="summary-right">
          <div className="rating-bars">
            {ratingBars.map(({ rating, count, percentage }) => (
              <div key={rating} className="rating-bar-row">
                <span className="bar-label">{rating}점</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${percentage}%` }} />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리뷰 작성 버튼 */}
      {isAuthenticated && writableOrders.length > 0 && !showWriteForm && (
        <div className="write-review-section">
          <p className="write-prompt">이 상품을 구매하셨나요?</p>
          <div className="writable-orders">
            {writableOrders.map(order => (
              <button
                key={`${order.orderId}-${order.productId}`}
                className="btn-write-review"
                onClick={() => {
                  setSelectedOrder(order)
                  setShowWriteForm(true)
                }}
              >
                리뷰 작성하기 ({order.orderNumber})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 작성 폼 */}
      {showWriteForm && selectedOrder && (
        <ReviewForm
          productId={selectedOrder.productId}
          orderId={selectedOrder.orderId}
          onSubmit={handleSubmitReview}
          onCancel={() => {
            setShowWriteForm(false)
            setSelectedOrder(null)
          }}
        />
      )}

      {/* 정렬 옵션 */}
      {reviews.length > 0 && (
        <div className="review-sort">
          <button 
            className={sort === 'newest' ? 'active' : ''}
            onClick={() => handleSortChange('newest')}
          >
            최신순
          </button>
          <button 
            className={sort === 'highest' ? 'active' : ''}
            onClick={() => handleSortChange('highest')}
          >
            높은 평점순
          </button>
          <button 
            className={sort === 'lowest' ? 'active' : ''}
            onClick={() => handleSortChange('lowest')}
          >
            낮은 평점순
          </button>
          <button 
            className={sort === 'helpful' ? 'active' : ''}
            onClick={() => handleSortChange('helpful')}
          >
            도움순
          </button>
        </div>
      )}

      {/* 리뷰 목록 */}
      <div className="review-list">
        {loading && reviews.length === 0 ? (
          <p className="loading-text">리뷰를 불러오는 중...</p>
        ) : reviews.length === 0 ? (
          <p className="no-content">아직 작성된 리뷰가 없습니다.</p>
        ) : (
          <>
            {reviews.map(review => (
              <ReviewItem
                key={review._id}
                review={review}
                currentUserId={user?._id}
                onHelpful={handleHelpful}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <button className="btn-load-more" onClick={handleLoadMore}>
                더보기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
})

// 탭 컴포넌트
const ProductTabs = memo(({ activeTab, onTabChange, product }) => {
  const tabs = [
    { id: 'detail', label: '상품상세' },
    { id: 'info', label: '배송/교환/반품' },
    { id: 'review', label: '리뷰' },
    { id: 'qna', label: 'Q&A' },
  ]

  return (
    <div className="product-tabs">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {activeTab === 'detail' && (
          <div className="tab-panel">
            <div className="product-description">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="no-content">상품 상세 정보가 없습니다.</p>
              )}
              {/* 상품 이미지들 표시 */}
              {product.images?.map((img, index) => (
                <div key={index} className="description-image">
                  <img src={img} alt={`상품 상세 이미지 ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'info' && (
          <div className="tab-panel">
            <div className="info-table">
              <h4>배송 안내</h4>
              <table>
                <tbody>
                  <tr>
                    <th>배송방법</th>
                    <td>택배배송</td>
                  </tr>
                  <tr>
                    <th>배송비</th>
                    <td>3,000원 (50,000원 이상 무료배송)</td>
                  </tr>
                  <tr>
                    <th>배송기간</th>
                    <td>결제완료 후 1-3일 이내 출고 (주말, 공휴일 제외)</td>
                  </tr>
                </tbody>
              </table>

              <h4>교환/반품 안내</h4>
              <table>
                <tbody>
                  <tr>
                    <th>교환/반품 기간</th>
                    <td>상품 수령일로부터 7일 이내</td>
                  </tr>
                  <tr>
                    <th>교환/반품 비용</th>
                    <td>고객 변심: 왕복 6,000원 / 상품 불량: 무료</td>
                  </tr>
                  <tr>
                    <th>교환/반품 불가</th>
                    <td>착용 흔적, 오염, 훼손된 경우 / 택, 라벨 제거한 경우</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'review' && (
          <div className="tab-panel">
            <ReviewSection productId={product._id} />
          </div>
        )}
        {activeTab === 'qna' && (
          <div className="tab-panel">
            <div className="qna-section">
              <button className="btn-write-qna">문의하기</button>
              <p className="no-content">등록된 문의가 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// 추천 상품 컴포넌트
const RecommendedProducts = memo(({ products, currentProductId }) => {
  const filtered = products.filter(p => p._id !== currentProductId).slice(0, 4)
  
  if (filtered.length === 0) return null

  return (
    <section className="recommended-section">
      <h3>함께 보면 좋은 상품</h3>
      <div className="recommended-grid">
        {filtered.map(product => (
          <Link 
            key={product._id} 
            to={`/product/${product._id}`}
            className="recommended-item"
          >
            <div className="recommended-image">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <div className="no-image">NO IMAGE</div>
              )}
            </div>
            <p className="recommended-name">{product.name}</p>
            <p className="recommended-price">₩{formatPrice(product.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
})

function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('detail')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(`/products/${productId}`)
        setProduct(response.data.data)
        
        // 관련 상품 로드 (같은 카테고리)
        if (response.data.data?.category) {
          const relatedResponse = await api.get(`/products?category=${encodeURIComponent(response.data.data.category)}&limit=5`)
          setRelatedProducts(relatedResponse.data.data || [])
        }
      } catch (err) {
        console.error('상품 로딩 실패:', err)
        setError('상품을 찾을 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
      window.scrollTo(0, 0)
    }
  }, [productId])

  // 수량 변경
  const handleQuantityChange = useCallback((newQty) => {
    setQuantity(newQty)
  }, [])

  // 장바구니 담기
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(productId, quantity)
      if (window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?')) {
        navigate('/cart')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setIsAddingToCart(false)
    }
  }, [isAuthenticated, productId, quantity, addToCart, navigate])

  // 바로 구매 - 장바구니에 추가 후 해당 상품만 선택하여 결제 페이지로 이동
  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(productId, quantity)
      // 바로 결제 페이지로 이동 (해당 상품만 선택)
      navigate('/checkout', { state: { selectedItems: [productId] } })
    } catch (error) {
      alert(error.message)
    } finally {
      setIsAddingToCart(false)
    }
  }, [isAuthenticated, productId, quantity, addToCart, navigate])

  // 탭 변경
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
  }, [])

  if (loading) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="loading-container">
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="error-container">
          <p>{error || '상품을 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <Navbar />

      {/* 브레드크럼 */}
      <div className="breadcrumb-container">
        <nav className="breadcrumb">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to={`/category/${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
      </div>

      {/* 상품 상단 섹션 */}
      <section className="product-top-section">
        <div className="product-container">
          <ImageGallery images={product.images} productName={product.name} />
          <ProductInfo 
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>
      </section>

      {/* 상품 탭 섹션 */}
      <section className="product-detail-section">
        <ProductTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          product={product}
        />
      </section>

      {/* 추천 상품 */}
      <RecommendedProducts 
        products={relatedProducts}
        currentProductId={productId}
      />

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>CUSTOMER CENTER</h4>
            <p className="phone">1234-5678</p>
            <p>평일 09:00 - 18:00</p>
          </div>
          <div className="footer-section">
            <h4>ABOUT</h4>
            <p>회사소개</p>
            <p>이용약관</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 성찬몰. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default memo(ProductDetail)

