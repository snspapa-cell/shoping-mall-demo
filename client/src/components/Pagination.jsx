import { memo, useMemo } from 'react'
import './Pagination.css'

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

function Pagination({ currentPage, totalPages, onPageChange }) {
  // 표시할 페이지 번호 계산
  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisible = 5
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

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
}

export default memo(Pagination)

