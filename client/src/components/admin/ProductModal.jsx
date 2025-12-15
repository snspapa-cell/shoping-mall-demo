import { useState, useEffect, useCallback, memo } from 'react'
import { CloseIcon } from '../icons/AdminIcons'
import { CATEGORIES } from '../../constants/adminData'

// 이미지 업로드 아이콘
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

// 삭제 아이콘
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Cloudinary 설정 (환경변수에서 가져오기)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// 최대 이미지 개수
const MAX_IMAGES = 5

// 가격 포맷팅 함수 (천 단위 콤마)
const formatPriceInput = (value) => {
  const numericValue = value.replace(/[^\d]/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 콤마 제거하고 숫자만 반환
const parsePriceValue = (value) => {
  return value.replace(/,/g, '')
}

// 상품 등록/수정 모달 컴포넌트
function ProductModal({ isOpen, onClose, product, onSave, loading: externalLoading }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    images: [],
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        price: product.price ? formatPriceInput(String(product.price)) : '',
        category: product.category || '',
        images: product.images || [],
        description: product.description || '',
      })
    } else {
      setFormData({
        sku: '',
        name: '',
        price: '',
        category: '',
        images: [],
        description: '',
      })
    }
    setImageUrlInput('')
    setError('')
  }, [product, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // 가격 필드는 특별 처리 (천 단위 콤마)
    if (name === 'price') {
      const formattedPrice = formatPriceInput(value)
      setFormData(prev => ({ ...prev, [name]: formattedPrice }))
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 이미지 추가
  const addImage = useCallback((imageUrl) => {
    if (!imageUrl) return
    
    setFormData(prev => {
      if (prev.images.length >= MAX_IMAGES) {
        setError(`이미지는 최대 ${MAX_IMAGES}개까지 등록 가능합니다.`)
        return prev
      }
      if (prev.images.includes(imageUrl)) {
        setError('이미 등록된 이미지입니다.')
        return prev
      }
      setError('')
      return { ...prev, images: [...prev.images, imageUrl] }
    })
  }, [])

  // 이미지 삭제
  const removeImage = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }, [])

  // URL 직접 입력으로 이미지 추가
  const handleAddImageUrl = useCallback(() => {
    if (!imageUrlInput.trim()) return
    addImage(imageUrlInput.trim())
    setImageUrlInput('')
  }, [imageUrlInput, addImage])

  // Enter 키로 URL 추가
  const handleImageUrlKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddImageUrl()
    }
  }, [handleAddImageUrl])

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = useCallback(() => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError('Cloudinary 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.')
      return
    }

    if (!window.cloudinary) {
      setError('Cloudinary 위젯을 로드할 수 없습니다. 페이지를 새로고침 해주세요.')
      return
    }

    const remainingSlots = MAX_IMAGES - formData.images.length
    if (remainingSlots <= 0) {
      setError(`이미지는 최대 ${MAX_IMAGES}개까지 등록 가능합니다.`)
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: true,
        maxFiles: remainingSlots,
        cropping: true,
        croppingAspectRatio: 3 / 4,
        croppingShowDimensions: true,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxImageFileSize: 5000000,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#8b7355',
            tabIcon: '#8b7355',
            menuIcons: '#8b7355',
            textDark: '#333333',
            textLight: '#FFFFFF',
            link: '#8b7355',
            action: '#8b7355',
            inactiveTabIcon: '#999999',
            error: '#ef4444',
            inProgress: '#8b7355',
            complete: '#22c55e',
            sourceBg: '#f8f7f5',
          },
          fonts: {
            default: null,
            "'Pretendard', sans-serif": {
              url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css',
              active: true,
            },
          },
        },
        language: 'ko',
        text: {
          ko: {
            or: '또는',
            back: '뒤로',
            advanced: '고급',
            close: '닫기',
            no_results: '결과 없음',
            search_placeholder: '검색...',
            about_uw: 'About Upload Widget',
            search: { placeholder: '검색...' },
            menu: {
              files: '내 파일',
              web: 'URL 주소',
              camera: '카메라',
            },
            local: {
              browse: '파일 선택',
              dd_title_single: '여기에 파일을 드래그 & 드롭',
              dd_title_multi: '여기에 파일을 드래그 & 드롭',
              drop_title_single: '파일을 여기에 놓으세요',
              drop_title_multiple: '파일을 여기에 놓으세요',
            },
            url: {
              inner_title: '이미지 URL 입력:',
              input_placeholder: 'https://example.com/image.jpg',
            },
            camera: {
              capture: '촬영',
              cancel: '취소',
              take_pic: '사진 촬영',
              explanation: '카메라가 촬영에 사용됩니다',
            },
            crop: {
              title: '이미지 자르기',
              crop_btn: '자르기',
              skip_btn: '건너뛰기',
              reset_btn: '초기화',
            },
            queue: {
              title: '업로드 대기열',
              title_uploading_with_counter: '{{num}}개 파일 업로드 중',
              upload_more: '파일 추가',
              done: '완료',
              statuses: {
                uploading: '업로드 중...',
                error: '오류',
                uploaded: '완료',
                aborted: '취소됨',
              },
            },
          },
        },
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url
          addImage(imageUrl)
        }
        if (error) {
          console.error('Cloudinary 업로드 에러:', error)
          setError('이미지 업로드에 실패했습니다.')
        }
      }
    )

    widget.open()
  }, [formData.images.length, addImage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.images.length === 0) {
      setError('상품 이미지를 1개 이상 등록해주세요.')
      setLoading(false)
      return
    }

    try {
      const submitData = {
        ...formData,
        price: parsePriceValue(formData.price),
      }
      await onSave(submitData, product)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || '상품 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isLoading = loading || externalLoading
  const canAddMoreImages = formData.images.length < MAX_IMAGES

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h2>{product ? '상품 수정' : '새 상품 등록'}</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sku">SKU *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="예: COAT-001"
                required
                disabled={!!product}
              />
              <span className="form-hint">영문 대문자, 숫자, 하이픈(-) 사용</span>
            </div>

            <div className="form-group">
              <label htmlFor="category">카테고리 *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">카테고리 선택</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">상품명 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="상품명을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">가격 (원) *</label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0"
              inputMode="numeric"
              required
            />
          </div>

          {/* 이미지 업로드 섹션 */}
          <div className="form-group">
            <label>상품 이미지 * ({formData.images.length}/{MAX_IMAGES})</label>
            
            {/* 이미지 미리보기 그리드 */}
            <div className="images-grid">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="image-item">
                  <img 
                    src={imageUrl} 
                    alt={`상품 이미지 ${index + 1}`}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Error</text></svg>'
                    }}
                  />
                  {index === 0 && <span className="main-badge">대표</span>}
                  <button 
                    type="button" 
                    className="image-delete-btn"
                    onClick={() => removeImage(index)}
                    title="삭제"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))}
              
              {/* 이미지 추가 버튼 */}
              {canAddMoreImages && (
                <div className="image-upload-area" onClick={openCloudinaryWidget}>
                  <UploadIcon />
                  <p>이미지 추가</p>
                  <span>최대 {MAX_IMAGES}장</span>
                </div>
              )}
            </div>
            
            {/* URL 직접 입력 옵션 */}
            {canAddMoreImages && (
              <div className="image-url-input">
                <span className="divider-text">또는 URL 직접 입력</span>
                <div className="url-input-row">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={handleImageUrlKeyDown}
                    placeholder="https://example.com/image.jpg"
                  />
                  <button 
                    type="button" 
                    className="btn-add-url"
                    onClick={handleAddImageUrl}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">상품 설명</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="상품에 대한 설명을 입력하세요 (선택사항)"
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-save" disabled={isLoading || formData.images.length === 0}>
              {isLoading ? '저장 중...' : (product ? '수정하기' : '등록하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default memo(ProductModal)
