import { useState, useEffect, useMemo, useCallback } from 'react'
import Navbar from '../components/Navbar'
import ProductSection from '../components/ProductSection'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '../components/icons/Icons'
import api from '../utils/axios'
import './Home.css'

// 상수 데이터 - 컴포넌트 외부에 정의하여 리렌더링 시 재생성 방지
const BANNER_SLIDES = [
  { id: 1, title: 'FOR YOUR BEST', subtitle: 'MOMENTS', bg: '#f5e6e0' },
  { id: 2, title: 'WINTER SALE', subtitle: 'UP TO 50%', bg: '#e6f0f5' },
  { id: 3, title: 'NEW ARRIVALS', subtitle: '2024 S/S', bg: '#f0f5e6' },
]

const LOOKBOOK_ITEMS = [
  { id: 1, title: "짧은 영상을 보면서 '숏:핑'", hasVideo: true },
  { id: 2, title: "예쁘니까 1+1", hasVideo: false },
  { id: 3, title: "실시간으로 사랑받는 'BEST'", hasVideo: false },
  { id: 4, title: "변하지 않는 가치 'MADE'", hasVideo: false },
  { id: 5, title: "따뜻한 겨울 '패딩 특집'", hasVideo: false },
  { id: 6, title: "데일리 코디 '니트 컬렉션'", hasVideo: false },
  { id: 7, title: "트렌디한 '아우터 모음'", hasVideo: false },
  { id: 8, title: "포근한 '홈웨어 특가'", hasVideo: true },
  { id: 9, title: "따뜻한 '플리스 컬렉션'", hasVideo: false },
  { id: 10, title: "겨울 필수템 '머플러'", hasVideo: true },
]

const VISIBLE_ITEMS = 4

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [lookbookIndex, setLookbookIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  
  // 상품 데이터 상태
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // 상품 데이터 API 호출
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // limit=0을 사용하면 전체 상품을 가져오거나, 큰 숫자를 지정
        const response = await api.get('/products?limit=100')
        setProducts(response.data.data || [])
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
  const lookbookItems = useMemo(() => [
    ...LOOKBOOK_ITEMS, 
    ...LOOKBOOK_ITEMS.slice(0, 4).map(item => ({ ...item, id: item.id + 100 }))
  ], [])

  // 자동 슬라이드 (메인 배너)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // 자동 슬라이드 (룩북)
  useEffect(() => {
    const timer = setInterval(() => {
      setLookbookIndex(prev => prev + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // 무한 반복 처리
  useEffect(() => {
    if (lookbookIndex >= LOOKBOOK_ITEMS.length) {
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
  }, [lookbookIndex])

  // 이벤트 핸들러 (메모이제이션)
  const nextSlide = useCallback(() => setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length), [])
  const prevSlide = useCallback(() => setCurrentSlide(prev => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length), [])
  const nextLookbook = useCallback(() => setLookbookIndex(prev => prev + 1), [])
  const prevLookbook = useCallback(() => setLookbookIndex(prev => (prev <= 0 ? 0 : prev - 1)), [])

  return (
    <div className="home-page">
      <Navbar topBannerText="성찬 쇼핑몰에서 고민하지마세요! 사이즈 무료 교환" />

      {/* 메인 배너 슬라이더 */}
      <section className="hero-banner">
        <div className="slider" style={{ backgroundColor: BANNER_SLIDES[currentSlide].bg }}>
          <button className="slider-btn prev" onClick={prevSlide}><ChevronLeftIcon /></button>
          
          <div className="slider-content">
            <h1>{BANNER_SLIDES[currentSlide].title}</h1>
            <h2>{BANNER_SLIDES[currentSlide].subtitle}</h2>
          </div>

          <button className="slider-btn next" onClick={nextSlide}><ChevronRightIcon /></button>

          <div className="slider-dots">
            {BANNER_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
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
          <span className="lookbook-page">{(lookbookIndex % LOOKBOOK_ITEMS.length) + 1} / {LOOKBOOK_ITEMS.length}</span>
        </div>
        <div className="lookbook-container">
          <button className="lookbook-nav prev" onClick={prevLookbook}><ChevronLeftIcon /></button>
          
          <div className="lookbook-viewport">
            <div 
              className={`lookbook-track ${isTransitioning ? '' : 'no-transition'}`}
              style={{ transform: `translateX(-${lookbookIndex * (100 / VISIBLE_ITEMS)}%)` }}
            >
              {lookbookItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="lookbook-item">
                  <div className="lookbook-image">
                    <div className="lookbook-placeholder">
                      <span>LOOK {item.id > 100 ? item.id - 100 : item.id}</span>
                    </div>
                    {item.hasVideo && (
                      <div className="video-badge"><PlayIcon /></div>
                    )}
                  </div>
                  <p className="lookbook-title">{item.title}</p>
                </div>
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
