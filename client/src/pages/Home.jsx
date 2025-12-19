import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import Navbar from '../components/Navbar'
import ProductSection from '../components/ProductSection'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '../components/icons/Icons'
import api from '../utils/axios'
import './Home.css'

// 룩북 아이템 컴포넌트 (메모이제이션)
const LookbookItem = memo(({ item, index }) => {
  const handleClick = useCallback(async () => {
    // 클릭수 증가 API 호출
    if (item._id && !item._id.includes('-ext-')) {
      try {
        await api.post(`/lookbooks/${item._id}/click`)
      } catch (e) {
        // 무시
      }
    }
    
    // 링크 또는 비디오 처리
    if (item.link) {
      if (item.linkTarget === '_blank') {
        window.open(item.link, '_blank')
      } else {
        window.location.href = item.link
      }
    } else if (item.mediaType === 'video' && item.videoUrl) {
      window.open(item.videoUrl, '_blank')
    }
  }, [item])

  // 원본 인덱스 계산 (확장된 아이템은 _id에 '-ext-' 포함)
  const displayIndex = item._id.includes('-ext-') 
    ? parseInt(item._id.split('-ext-')[1]) + 1
    : index + 1

  return (
    <div className="lookbook-item" onClick={handleClick}>
      <div className="lookbook-image">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} />
        ) : (
          <div className="lookbook-placeholder">
            <span>LOOK {displayIndex <= 10 ? displayIndex : displayIndex - Math.floor(displayIndex / 10) * 10}</span>
          </div>
        )}
        {item.mediaType === 'video' && (
          <div className="video-badge"><PlayIcon /></div>
        )}
      </div>
      <p className="lookbook-title">{item.title}</p>
    </div>
  )
})

LookbookItem.displayName = 'LookbookItem'

// 기본 배너 데이터 (API 데이터가 없을 경우 사용)
const DEFAULT_BANNERS = [
  { _id: '1', title: 'FOR YOUR BEST', subtitle: 'MOMENTS', backgroundColor: '#f5e6e0', textColor: '#1a1a1a', link: '' },
  { _id: '2', title: 'WINTER SALE', subtitle: 'UP TO 50%', backgroundColor: '#e6f0f5', textColor: '#1a1a1a', link: '' },
  { _id: '3', title: 'NEW ARRIVALS', subtitle: '2024 S/S', backgroundColor: '#f0f5e6', textColor: '#1a1a1a', link: '' },
]

// 기본 룩북 데이터 (API 데이터가 없을 경우 사용)
const DEFAULT_LOOKBOOKS = [
  { _id: '1', title: "짧은 영상을 보면서 '숏:핑'", mediaType: 'video', thumbnail: '' },
  { _id: '2', title: "예쁘니까 1+1", mediaType: 'image', thumbnail: '' },
  { _id: '3', title: "실시간으로 사랑받는 'BEST'", mediaType: 'image', thumbnail: '' },
  { _id: '4', title: "변하지 않는 가치 'MADE'", mediaType: 'image', thumbnail: '' },
  { _id: '5', title: "따뜻한 겨울 '패딩 특집'", mediaType: 'image', thumbnail: '' },
  { _id: '6', title: "데일리 코디 '니트 컬렉션'", mediaType: 'image', thumbnail: '' },
  { _id: '7', title: "트렌디한 '아우터 모음'", mediaType: 'image', thumbnail: '' },
  { _id: '8', title: "포근한 '홈웨어 특가'", mediaType: 'video', thumbnail: '' },
  { _id: '9', title: "따뜻한 '플리스 컬렉션'", mediaType: 'image', thumbnail: '' },
  { _id: '10', title: "겨울 필수템 '머플러'", mediaType: 'video', thumbnail: '' },
]

const VISIBLE_ITEMS = 4

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [lookbookIndex, setLookbookIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  
  // 배너 데이터 상태
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  
  // 룩북 데이터 상태
  const [lookbookData, setLookbookData] = useState(DEFAULT_LOOKBOOKS)
  
  // 상품 데이터 상태
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // 배너 데이터 API 호출
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners/active')
        if (response.data.data && response.data.data.length > 0) {
          setBanners(response.data.data)
        }
      } catch (error) {
        console.error('배너 데이터 로딩 실패:', error)
        // 기본 배너 사용
      }
    }

    fetchBanners()
  }, [])

  // 룩북 데이터 API 호출
  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const response = await api.get('/lookbooks/active')
        if (response.data.data && response.data.data.length > 0) {
          setLookbookData(response.data.data)
        }
      } catch (error) {
        console.error('룩북 데이터 로딩 실패:', error)
        // 기본 룩북 사용
      }
    }

    fetchLookbooks()
  }, [])

  // 상품 데이터 API 호출
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // limit=100을 사용하여 충분한 상품 데이터 가져오기
        const response = await api.get('/products?limit=100')
        const productData = response.data?.data || response.data || []
        setProducts(Array.isArray(productData) ? productData : [])
      } catch (error) {
        console.error('상품 데이터 로딩 실패:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // 카테고리별 상품 필터링 (메모이제이션)
  const saleProducts = useMemo(() => {
    // 오늘의특가 카테고리 상품 또는 전체 상품 8개
    const saleCategory = products.filter(p => p.category === '오늘의특가')
    return saleCategory.length > 0 ? saleCategory.slice(0, 8) : products.slice(0, 8)
  }, [products])

  const bestProducts = useMemo(() => {
    // BEST 카테고리 상품 또는 전체 상품 8개
    const bestCategory = products.filter(p => p.category === 'BEST')
    return bestCategory.length > 0 ? bestCategory.slice(0, 8) : products.slice(0, 8)
  }, [products])

  const newProducts = useMemo(() => {
    // 겨울신상 카테고리 상품 또는 최신 등록 상품 8개
    const newCategory = products.filter(p => p.category === '겨울신상')
    return newCategory.length > 0 ? newCategory.slice(0, 8) : products.slice(0, 8)
  }, [products])

  // 무한 반복을 위한 룩북 아이템 (메모이제이션)
  const lookbookItems = useMemo(() => {
    const extendedItems = lookbookData.slice(0, 4).map((item, idx) => ({
      ...item,
      _id: `${item._id}-ext-${idx}`
    }))
    return [...lookbookData, ...extendedItems]
  }, [lookbookData])

  // 자동 슬라이드 (메인 배너)
  useEffect(() => {
    if (banners.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [banners.length])

  // 자동 슬라이드 (룩북)
  useEffect(() => {
    const timer = setInterval(() => {
      setLookbookIndex(prev => prev + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // 무한 반복 처리
  useEffect(() => {
    if (lookbookData.length > 0 && lookbookIndex >= lookbookData.length) {
      const resetTimer = setTimeout(() => {
        setIsTransitioning(false)
        setLookbookIndex(0)
      }, 500)
      
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(true)
      }, 550)

      return () => {
        clearTimeout(resetTimer)
        clearTimeout(transitionTimer)
      }
    }
  }, [lookbookIndex, lookbookData.length])

  // 이벤트 핸들러 (메모이제이션)
  const nextSlide = useCallback(() => setCurrentSlide(prev => (prev + 1) % banners.length), [banners.length])
  const prevSlide = useCallback(() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length), [banners.length])
  
  // 배너 클릭 처리
  const handleBannerClick = useCallback(async (banner) => {
    // 클릭수 증가 (API 호출)
    if (banner._id && !banner._id.startsWith('default')) {
      try {
        await api.post(`/banners/${banner._id}/click`)
      } catch (e) {
        // 무시
      }
    }
    
    // 링크가 있으면 이동
    if (banner.link) {
      if (banner.linkTarget === '_blank') {
        window.open(banner.link, '_blank')
      } else {
        window.location.href = banner.link
      }
    }
  }, [])
  const nextLookbook = useCallback(() => setLookbookIndex(prev => prev + 1), [])
  const prevLookbook = useCallback(() => setLookbookIndex(prev => (prev <= 0 ? 0 : prev - 1)), [])

  return (
    <div className="home-page">
      <Navbar topBannerText="성찬 쇼핑몰에서 고민하지마세요! 사이즈 무료 교환" />

      {/* 메인 배너 슬라이더 - 페이드 효과 */}
      <section className="hero-banner">
        {banners.length > 0 && (
          <div className="slider-wrapper">
            {banners.map((banner, index) => (
              <div 
                key={banner._id || index}
                className={`slider-slide ${index === currentSlide ? 'active' : ''} ${banner.link ? 'clickable' : ''} ${banner.image ? 'has-image' : ''}`}
                style={{ 
                  backgroundColor: banner.backgroundColor || '#f0f5e6',
                  color: banner.textColor || '#1a1a1a',
                }}
                onClick={() => handleBannerClick(banner)}
              >
                {/* 배너 이미지 - 원본 비율 유지 */}
                {banner.image && (
                  <img 
                    src={banner.image} 
                    alt={banner.title || '배너 이미지'} 
                    className="banner-image"
                  />
                )}
                {/* 텍스트 콘텐츠 - 이미지 위에 오버레이 또는 이미지 없을 때 표시 */}
                {(!banner.image || banner.title || banner.subtitle) && (
                  <div className="slider-content">
                    {banner.title && <h1>{banner.title}</h1>}
                    {banner.subtitle && <h2>{banner.subtitle}</h2>}
                    {banner.buttonText && (
                      <button className="banner-btn">{banner.buttonText}</button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <button className="slider-btn prev" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
              <ChevronLeftIcon />
            </button>
            <button className="slider-btn next" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
              <ChevronRightIcon />
            </button>

            <div className="slider-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 브랜드 소개 */}
      <section className="brand-section">
        <h2>성찬몰은</h2>
        <p>트렌디한 여성의류를 합리적 가격과 소비자에게 감동적인 오리지널 상품과 양질의 서비스를 제공하기 위해<br/>
        가장 빠른 배송과 소통하기 쉬운 고객센터를 통해 고객님께 다가갑니다.</p>
      </section>

      {/* 룩북 슬라이더 */}
      <section className="lookbook-section">
        <div className="lookbook-header">
          <span className="lookbook-page">
            {lookbookData.length > 0 ? `${(lookbookIndex % lookbookData.length) + 1} / ${lookbookData.length}` : '0 / 0'}
          </span>
        </div>
        <div className="lookbook-container">
          <button className="lookbook-nav prev" onClick={prevLookbook}><ChevronLeftIcon /></button>
          
          <div className="lookbook-viewport">
            <div 
              className={`lookbook-track ${isTransitioning ? '' : 'no-transition'}`}
              style={{ transform: `translateX(-${lookbookIndex * (100 / VISIBLE_ITEMS)}%)` }}
            >
              {lookbookItems.map((item, index) => (
                <LookbookItem key={`${item._id}-${index}`} item={item} index={index} />
              ))}
            </div>
          </div>
          
          <button className="lookbook-nav next" onClick={nextLookbook}><ChevronRightIcon /></button>
        </div>
      </section>

      {/* 상품 섹션들 */}
      {loading ? (
        <div className="loading-products">
          <p>상품을 불러오는 중...</p>
        </div>
      ) : (
        <>
          <ProductSection 
            title="🔥 내일 되면 다시 가격 올라요!"
            subtitle="오늘이 제일싸요♡성찬몰 특가"
            products={saleProducts}
            variant="default"
            label="SALE"
            className="sale-section"
          />

          <ProductSection 
            title="WEEKLY BEST"
            subtitle="시선집중! 지금 주목해야 할"
            products={bestProducts}
            variant="weekly"
            label="BEST"
            className="weekly-section"
          />

          <ProductSection 
            title="NEW ITEM"
            subtitle="안녕, 신상 할인까지!?"
            products={newProducts}
            variant="new"
            label="NEW"
            className="new-section"
          />
        </>
      )}

      {/* 상품이 없을 때 메시지 */}
      {!loading && products.length === 0 && (
        <div className="no-products">
          <p>등록된 상품이 없습니다.</p>
          <p>관리자 페이지에서 상품을 등록해주세요.</p>
        </div>
      )}

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>CUSTOMER CENTER</h4>
            <p className="phone">1234-5678</p>
            <p>평일 09:00 - 18:00</p>
            <p>점심 12:00 - 13:00</p>
          </div>
          <div className="footer-section">
            <h4>ABOUT</h4>
            <p>회사소개</p>
            <p>이용약관</p>
            <p>개인정보처리방침</p>
          </div>
          <div className="footer-section">
            <h4>SOCIAL</h4>
            <div className="social-icons">
              <span className="social-icon">📘</span>
              <span className="social-icon">📸</span>
              <span className="social-icon">🐦</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 성찬몰. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
