import { useState, useEffect, useCallback, memo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/axios'
import './ProductDetail.css'

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
            <div className="review-section">
              <div className="review-summary">
                <span className="review-count">리뷰 0개</span>
              </div>
              <p className="no-content">아직 작성된 리뷰가 없습니다.</p>
            </div>
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

  // 바로 구매
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
      navigate('/cart')
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

