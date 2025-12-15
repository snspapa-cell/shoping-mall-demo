import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { ProductIcon, PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../icons/AdminIcons'
import { CATEGORIES, formatPrice } from '../../constants/adminData'
import useProducts from '../../hooks/useProducts'
import ProductModal from './ProductModal'
import DeleteConfirmModal from './DeleteConfirmModal'

// 페이지네이션 아이콘
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// 상품 테이블 행 컴포넌트
const ProductRow = memo(({ product, onEdit, onDelete }) => (
  <tr>
    <td>
      <div className="product-thumbnail">
        {product.images?.length > 0 ? (
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>
    </td>
    <td className="sku">{product.sku}</td>
    <td className="product-name">{product.name}</td>
    <td>
      <span className="category-badge">{product.category}</span>
    </td>
    <td className="price">₩{formatPrice(product.price)}</td>
    <td className="date">
      {new Date(product.createdAt).toLocaleDateString('ko-KR')}
    </td>
    <td>
      <div className="action-buttons">
        <button 
          className="btn-icon edit" 
          onClick={() => onEdit(product)}
          title="수정"
        >
          <EditIcon />
        </button>
        <button 
          className="btn-icon delete" 
          onClick={() => onDelete(product)}
          title="삭제"
        >
          <TrashIcon />
        </button>
      </div>
    </td>
  </tr>
))

// 페이지네이션 컴포넌트
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    // 끝에서 시작점 재조정
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="pagination">
      <button 
        className="pagination-btn prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon />
        <span>이전</span>
      </button>
      
      <div className="pagination-numbers">
        {pageNumbers[0] > 1 && (
          <>
            <button 
              className="pagination-num"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="pagination-dots">...</span>}
          </>
        )}
        
        {pageNumbers.map(num => (
          <button
            key={num}
            className={`pagination-num ${currentPage === num ? 'active' : ''}`}
            onClick={() => onPageChange(num)}
          >
            {num}
          </button>
        ))}
        
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination-dots">...</span>
            )}
            <button 
              className="pagination-num"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
      
      <button 
        className="pagination-btn next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span>다음</span>
        <ChevronRightIcon />
      </button>
    </div>
  )
})

// 상품 관리 컨텐츠 컴포넌트
function ProductsContent() {
  const { products, loading, pagination, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editProduct, setEditProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 상품 목록 로드
  useEffect(() => {
    fetchProducts(categoryFilter, currentPage)
  }, [fetchProducts, categoryFilter, currentPage])

  // 카테고리 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
  }, [categoryFilter])

  // 필터링된 상품 목록 (클라이언트 사이드 검색)
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const term = searchTerm.toLowerCase()
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    )
  }, [products, searchTerm])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    // 스크롤을 테이블 상단으로 이동
    document.querySelector('.products-table-wrapper')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 모달 핸들러
  const handleOpenModal = useCallback((product = null) => {
    setEditProduct(product)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditProduct(null)
  }, [])

  // 상품 저장 핸들러
  const handleSaveProduct = useCallback(async (formData, existingProduct) => {
    if (existingProduct) {
      await updateProduct(existingProduct._id, formData)
    } else {
      await createProduct(formData)
    }
    fetchProducts(categoryFilter, currentPage)
  }, [createProduct, updateProduct, fetchProducts, categoryFilter, currentPage])

  // 삭제 핸들러
  const handleDeleteClick = useCallback((product) => {
    setDeleteModal({ isOpen: true, product })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.product) return
    
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteModal.product._id)
      // 현재 페이지에 상품이 1개만 있고 첫 페이지가 아니면 이전 페이지로 이동
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      } else {
        fetchProducts(categoryFilter, currentPage)
      }
    } catch (error) {
      console.error('상품 삭제 실패:', error)
    } finally {
      setDeleteLoading(false)
      setDeleteModal({ isOpen: false, product: null })
    }
  }, [deleteModal.product, deleteProduct, fetchProducts, categoryFilter, currentPage, products.length])

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, product: null })
  }, [])

  return (
    <>
      {/* 상품 관리 헤더 */}
      <div className="content-header">
        <div className="content-title">
          <h2>상품 관리</h2>
          <p>총 {pagination.total}개의 상품</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <PlusIcon />
          <span>새 상품 등록</span>
        </button>
      </div>

      {/* 필터 & 검색 */}
      <div className="filter-bar">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="상품명 또는 SKU로 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 카테고리</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 상품 목록 테이블 */}
      <div className="products-table-wrapper">
        {loading ? (
          <div className="loading-state">로딩 중...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <ProductIcon />
            <p>등록된 상품이 없습니다.</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              첫 상품 등록하기
            </button>
          </div>
        ) : (
          <>
            <table className="products-table">
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>SKU</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <ProductRow 
                    key={product._id}
                    product={product}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />

            {/* 페이지 정보 */}
            <div className="pagination-info">
              {pagination.total > 0 && (
                <span>
                  {((pagination.page - 1) * 5) + 1} - {Math.min(pagination.page * 5, pagination.total)} / 총 {pagination.total}개
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* 모달들 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editProduct}
        onSave={handleSaveProduct}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.product?.name}
        loading={deleteLoading}
      />
    </>
  )
}

export default memo(ProductsContent)
