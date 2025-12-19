import { useState, useEffect, useCallback, memo } from 'react'
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon, SearchIcon, CloseIcon } from '../icons/AdminIcons'
import { BANNER_TYPES } from '../../constants/adminData'
import api from '../../utils/axios'
import './BannersContent.css'

// 배너 타입 라벨
const getBannerTypeLabel = (type) => {
  const found = BANNER_TYPES.find(t => t.value === type)
  return found ? found.label : type
}

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR')
}

// 배너 모달 컴포넌트
const BannerModal = memo(({ banner, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    backgroundColor: '#f0f5e6',
    textColor: '#1a1a1a',
    image: '',
    mobileImage: '',
    link: '',
    linkTarget: '_self',
    buttonText: '',
    type: 'event',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        backgroundColor: banner.backgroundColor || '#f0f5e6',
        textColor: banner.textColor || '#1a1a1a',
        image: banner.image || '',
        mobileImage: banner.mobileImage || '',
        link: banner.link || '',
        linkTarget: banner.linkTarget || '_self',
        buttonText: banner.buttonText || '',
        type: banner.type || 'event',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
        order: banner.order || 0,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : '',
      })
    }
  }, [banner])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImageUpload = (field) => {
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary 설정이 필요합니다.')
      return
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFileSize: 5000000,
        cropping: true,
        croppingAspectRatio: field === 'mobileImage' ? 1 : 2.5,
      },
      (error, result) => {
        if (!error && result.event === 'success') {
          setFormData(prev => ({
            ...prev,
            [field]: result.info.secure_url,
          }))
        }
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('배너 제목을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      
      const submitData = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      if (banner) {
        await api.put(`/banners/${banner._id}`, submitData)
        alert('배너가 수정되었습니다.')
      } else {
        await api.post('/banners', submitData)
        alert('배너가 생성되었습니다.')
      }

      onSave()
      onClose()
    } catch (error) {
      alert(error.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content banner-modal">
        <div className="modal-header">
          <h2>{banner ? '배너 수정' : '새 배너 등록'}</h2>
          <button className="btn-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-section">
            <h3>기본 정보</h3>
            
            <div className="form-group">
              <label>제목 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: NEW ARRIVALS"
                required
              />
            </div>

            <div className="form-group">
              <label>부제목</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="예: 2024 S/S"
              />
            </div>

            <div className="form-group">
              <label>설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="배너 설명"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>배너 타입</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  {BANNER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>순서</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>스타일</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>배경색</label>
                <div className="color-input">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    name="backgroundColor"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>텍스트 색상</label>
                <div className="color-input">
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={handleChange}
                    name="textColor"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                배경 이미지 (PC)
                <span className="size-hint">권장: 1920 x 768px (비율 2.5:1)</span>
              </label>
              <div className="image-upload-area">
                {formData.image ? (
                  <div className="image-preview">
                    <img src={formData.image} alt="배경 이미지" />
                    <button type="button" className="btn-remove" onClick={() => setFormData(p => ({ ...p, image: '' }))}>
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-upload" onClick={() => handleImageUpload('image')}>
                    이미지 업로드
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>
                배경 이미지 (모바일)
                <span className="size-hint">권장: 750 x 750px (비율 1:1)</span>
              </label>
              <div className="image-upload-area">
                {formData.mobileImage ? (
                  <div className="image-preview mobile">
                    <img src={formData.mobileImage} alt="모바일 이미지" />
                    <button type="button" className="btn-remove" onClick={() => setFormData(p => ({ ...p, mobileImage: '' }))}>
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-upload" onClick={() => handleImageUpload('mobileImage')}>
                    이미지 업로드
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>링크 설정</h3>
            
            <div className="form-group">
              <label>링크 URL</label>
              <input
                type="text"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://... 또는 /category/..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>링크 열기 방식</label>
                <select name="linkTarget" value={formData.linkTarget} onChange={handleChange}>
                  <option value="_self">현재 창</option>
                  <option value="_blank">새 창</option>
                </select>
              </div>
              <div className="form-group">
                <label>버튼 텍스트</label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  placeholder="예: 자세히 보기"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>기간 설정</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>시작일</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>종료일</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <p className="form-hint">비워두면 기간 제한 없이 표시됩니다.</p>
          </div>

          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>활성화 (체크하면 배너가 표시됩니다)</span>
            </label>
          </div>

          {/* 미리보기 */}
          <div className="form-section">
            <h3>미리보기</h3>
            <div 
              className="banner-preview"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                backgroundImage: formData.image ? `url(${formData.image})` : 'none',
              }}
            >
              <div className="preview-content">
                <h1>{formData.title || '제목을 입력하세요'}</h1>
                {formData.subtitle && <h2>{formData.subtitle}</h2>}
                {formData.buttonText && <button className="preview-btn">{formData.buttonText}</button>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '저장 중...' : banner ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

// 배너 카드 컴포넌트
const BannerCard = memo(({ banner, onEdit, onDelete, onToggle }) => (
  <div className={`banner-card ${!banner.isActive ? 'inactive' : ''}`}>
    <div 
      className="banner-preview-small"
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
        backgroundImage: banner.image ? `url(${banner.image})` : 'none',
      }}
    >
      <div className="preview-text">
        <span className="preview-title">{banner.title}</span>
        {banner.subtitle && <span className="preview-subtitle">{banner.subtitle}</span>}
      </div>
      <span className={`banner-type-badge ${banner.type}`}>
        {getBannerTypeLabel(banner.type)}
      </span>
    </div>

    <div className="banner-info">
      <div className="banner-meta">
        <span className="meta-item">
          순서: {banner.order}
        </span>
        <span className="meta-item">
          조회: {banner.viewCount || 0}
        </span>
        <span className="meta-item">
          클릭: {banner.clickCount || 0}
        </span>
      </div>
      {(banner.startDate || banner.endDate) && (
        <div className="banner-period">
          {formatDate(banner.startDate)} ~ {formatDate(banner.endDate)}
        </div>
      )}
    </div>

    <div className="banner-actions">
      <button 
        className={`btn-toggle ${banner.isActive ? 'active' : ''}`}
        onClick={() => onToggle(banner._id)}
        title={banner.isActive ? '비활성화' : '활성화'}
      >
        {banner.isActive ? <EyeIcon /> : <EyeOffIcon />}
      </button>
      <button className="btn-edit" onClick={() => onEdit(banner)}>
        <EditIcon />
      </button>
      <button className="btn-delete" onClick={() => onDelete(banner._id)}>
        <TrashIcon />
      </button>
    </div>
  </div>
))

// 메인 컴포넌트
function BannersContent() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [filter, setFilter] = useState({ type: '', isActive: '' })
  const [searchTerm, setSearchTerm] = useState('')

  // 배너 목록 조회
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.isActive) params.append('isActive', filter.isActive)
      if (searchTerm) params.append('search', searchTerm)

      const response = await api.get(`/banners?${params}`)
      setBanners(response.data.data || [])
    } catch (error) {
      console.error('배너 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, searchTerm])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // 새 배너 추가
  const handleAddBanner = useCallback(() => {
    setEditingBanner(null)
    setShowModal(true)
  }, [])

  // 배너 수정
  const handleEditBanner = useCallback((banner) => {
    setEditingBanner(banner)
    setShowModal(true)
  }, [])

  // 배너 삭제
  const handleDeleteBanner = useCallback(async (bannerId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/banners/${bannerId}`)
      alert('배너가 삭제되었습니다.')
      fetchBanners()
    } catch (error) {
      alert(error.response?.data?.message || '삭제에 실패했습니다.')
    }
  }, [fetchBanners])

  // 배너 활성화/비활성화 토글
  const handleToggleBanner = useCallback(async (bannerId) => {
    try {
      await api.put(`/banners/${bannerId}/toggle`)
      fetchBanners()
    } catch (error) {
      alert(error.response?.data?.message || '처리에 실패했습니다.')
    }
  }, [fetchBanners])

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingBanner(null)
  }, [])

  // 필터 변경
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target
    setFilter(prev => ({ ...prev, [name]: value }))
  }, [])

  return (
    <div className="banners-content">
      {/* 상단 툴바 */}
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="배너 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select name="type" value={filter.type} onChange={handleFilterChange}>
            <option value="">모든 타입</option>
            {BANNER_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select name="isActive" value={filter.isActive} onChange={handleFilterChange}>
            <option value="">모든 상태</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>

        <button className="btn-add" onClick={handleAddBanner}>
          <PlusIcon />
          <span>새 배너 등록</span>
        </button>
      </div>

      {/* 배너 목록 */}
      {loading ? (
        <div className="loading-state">배너를 불러오는 중...</div>
      ) : banners.length === 0 ? (
        <div className="empty-state">
          <p>등록된 배너가 없습니다.</p>
          <button className="btn-add-first" onClick={handleAddBanner}>
            첫 번째 배너 등록하기
          </button>
        </div>
      ) : (
        <div className="banners-grid">
          {banners.map(banner => (
            <BannerCard
              key={banner._id}
              banner={banner}
              onEdit={handleEditBanner}
              onDelete={handleDeleteBanner}
              onToggle={handleToggleBanner}
            />
          ))}
        </div>
      )}

      {/* 배너 모달 */}
      {showModal && (
        <BannerModal
          banner={editingBanner}
          onClose={handleCloseModal}
          onSave={fetchBanners}
        />
      )}
    </div>
  )
}

export default memo(BannersContent)

