import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CategoryProductCard from '../components/CategoryProductCard'
import Pagination from '../components/Pagination'
import api from '../utils/axios'
import './Category.css'

// 카테고리 목록
const CATEGORIES = [
  'BEST', '겨울신상', '패딩', 'MADE', '오늘의특가', '아우터',
  '원피스', '니트', '티셔츠', '팬츠', '스커트', '악세서리'
]

// 정렬 옵션
const SORT_OPTIONS = [
  { value: '', label: '신상품순' },
  { value: 'price_asc', label: '낮은가격순' },
  { value: 'price_desc', label: '높은가격순' },
  { value: 'name', label: '상품명순' },
]

// 가격대 옵션
const PRICE_RANGES = [
  { id: 'all', label: '전체', min: '', max: '' },
  { id: 'under50', label: '5만원 이하', min: '', max: 50000 },
  { id: '50to100', label: '5만 ~ 10만원', min: 50000, max: 100000 },
  { id: '100to200', label: '10만 ~ 20만원', min: 100000, max: 200000 },
  { id: '200to300', label: '20만 ~ 30만원', min: 200000, max: 300000 },
  { id: 'over300', label: '30만원 이상', min: 300000, max: '' },
]

// 가격 포맷 함수 (천 단위 콤마)
const formatPriceInput = (value) => {
  if (!value) return ''
  const numericValue = String(value).replace(/[^\d]/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 콤마 제거 함수
const parsePriceValue = (value) => {
  if (!value) return ''
  return String(value).replace(/,/g, '')
}

// 필터 사이드바 컴포넌트
const FilterSidebar = memo(({ currentCategory, priceRange, selectedPriceRange, onPriceChange, onPriceRangeSelect }) => (
  <aside className="category-sidebar">
    <div className="filter-section">
      <h3>카테고리</h3>
      <ul className="category-list">
        {CATEGORIES.map(cat => (
          <li key={cat}>
            <Link 
              to={`/category/${encodeURIComponent(cat)}`}
              className={`category-item ${currentCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </Link>
          </li>
        ))}
      </ul>
    </div>

    <div className="filter-section">
      <h3>가격대</h3>
      
      {/* 가격대 버튼 */}
      <div className="price-range-buttons">
        {PRICE_RANGES.map(range => (
          <button
            key={range.id}
            className={`price-range-btn ${selectedPriceRange === range.id ? 'active' : ''}`}
            onClick={() => onPriceRangeSelect(range)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* 직접 입력 */}
      <div className="price-direct-input">
        <span className="direct-input-label">직접 입력</span>
        <div className="price-input-row">
          <div className="price-input-wrapper">
            <input
              type="text"
              inputMode="numeric"
              placeholder="최소"
              value={formatPriceInput(priceRange.min)}
              onChange={(e) => onPriceChange('min', parsePriceValue(e.target.value))}
            />
            <span className="price-unit">원</span>
          </div>
          <span className="price-separator">~</span>
          <div className="price-input-wrapper">
            <input
              type="text"
              inputMode="numeric"
              placeholder="최대"
              value={formatPriceInput(priceRange.max)}
              onChange={(e) => onPriceChange('max', parsePriceValue(e.target.value))}
            />
            <span className="price-unit">원</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
))

// 상품 그리드 컴포넌트
const ProductGrid = memo(({ products, loading }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <p>상품을 불러오는 중...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>해당 카테고리에 상품이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="category-product-grid">
      {products.map((product, index) => (
        <CategoryProductCard 
          key={product._id || index} 
          product={product} 
        />
      ))}
    </div>
  )
})

function Category() {
  const { categoryName } = useParams()
  const decodedCategory = decodeURIComponent(categoryName || '')
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOption, setSortOption] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('category', decodedCategory)
        params.append('page', currentPage)
        params.append('limit', 12)
        if (sortOption) params.append('sort', sortOption)
        if (priceRange.min) params.append('minPrice', priceRange.min)
        if (priceRange.max) params.append('maxPrice', priceRange.max)

        const response = await api.get(`/products?${params.toString()}`)
        setProducts(response.data.data || [])
        setPagination({
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || 0,
        })
      } catch (error) {
        console.error('상품 로딩 실패:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (decodedCategory) {
      fetchProducts()
    }
  }, [decodedCategory, currentPage, sortOption, priceRange])

  // 카테고리 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1)
  }, [decodedCategory])

  // 가격 필터 변경 핸들러 (직접 입력)
  const handlePriceChange = useCallback((type, value) => {
    setPriceRange(prev => ({ ...prev, [type]: value }))
    setSelectedPriceRange('') // 직접 입력 시 버튼 선택 해제
    setCurrentPage(1)
  }, [])

  // 가격대 버튼 선택 핸들러
  const handlePriceRangeSelect = useCallback((range) => {
    setSelectedPriceRange(range.id)
    setPriceRange({ min: range.min, max: range.max })
    setCurrentPage(1)
  }, [])

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((e) => {
    setSortOption(e.target.value)
    setCurrentPage(1)
  }, [])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="category-page">
      <Navbar />

      {/* 카테고리 헤더 */}
      <div className="category-header">
        <div className="category-header-content">
          <nav className="breadcrumb">
            <Link to="/">홈</Link>
            <span>/</span>
            <span>{decodedCategory}</span>
          </nav>
          <h1>{decodedCategory}</h1>
          <p className="product-count">총 {pagination.total}개의 상품</p>
        </div>
      </div>

      <div className="category-container">
        {/* 사이드바 필터 */}
        <FilterSidebar 
          currentCategory={decodedCategory}
          priceRange={priceRange}
          selectedPriceRange={selectedPriceRange}
          onPriceChange={handlePriceChange}
          onPriceRangeSelect={handlePriceRangeSelect}
        />

        {/* 메인 콘텐츠 */}
        <main className="category-main">
          {/* 정렬 & 필터 바 */}
          <div className="category-toolbar">
            <div className="view-options">
              <span>정렬</span>
              <select value={sortOption} onChange={handleSortChange}>
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 상품 그리드 */}
          <ProductGrid products={products} loading={loading} />

          {/* 페이지네이션 */}
          {!loading && products.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>

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

export default memo(Category)

