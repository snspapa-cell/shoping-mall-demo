import { useState, useEffect, useCallback, memo } from 'react';
import api from '../../utils/axios';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, SearchIcon, VideoIcon, DragIcon, EyeIcon, EyeOffIcon } from '../icons/AdminIcons';
import './LookbooksContent.css';

// Cloudinary 설정
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// 미디어 타입 옵션
const MEDIA_TYPES = [
  { value: 'image', label: '이미지' },
  { value: 'video', label: '동영상' },
];

// 비디오 플랫폼 옵션
const VIDEO_PLATFORMS = [
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: '기타' },
];

// 초기 폼 상태
const initialFormState = {
  title: '',
  description: '',
  mediaType: 'image',
  thumbnail: '',
  image: '',
  videoUrl: '',
  videoPlatform: 'youtube_shorts',
  link: '',
  linkTarget: '_self',
  isActive: true,
};

// 룩북 카드 컴포넌트
const LookbookCard = memo(({ lookbook, onEdit, onDelete, onToggle, onDragStart, onDragOver, onDrop }) => {
  const { _id, title, description, mediaType, thumbnail, image, isActive, viewCount, clickCount, order } = lookbook;
  const displayImage = thumbnail || image;

  return (
    <div
      className={`lookbook-card ${!isActive ? 'inactive' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, lookbook)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, lookbook)}
    >
      <div className="lookbook-card-drag">
        <DragIcon />
      </div>
      <div className="lookbook-card-order">{order + 1}</div>
      <div className="lookbook-card-thumbnail">
        {displayImage ? (
          <img src={displayImage} alt={title} />
        ) : (
          <div className="lookbook-card-placeholder">
            <span>No Image</span>
          </div>
        )}
        {mediaType === 'video' && (
          <div className="lookbook-card-video-badge">
            <VideoIcon />
          </div>
        )}
      </div>
      <div className="lookbook-card-content">
        <h4 className="lookbook-card-title">{title}</h4>
        {description && <p className="lookbook-card-desc">{description}</p>}
        <div className="lookbook-card-stats">
          <span>👁 {viewCount || 0}</span>
          <span>👆 {clickCount || 0}</span>
        </div>
      </div>
      <div className="lookbook-card-actions">
        <button
          className={`action-btn toggle ${isActive ? 'active' : ''}`}
          onClick={() => onToggle(_id)}
          title={isActive ? '비활성화' : '활성화'}
        >
          {isActive ? <EyeIcon /> : <EyeOffIcon />}
        </button>
        <button className="action-btn edit" onClick={() => onEdit(lookbook)}>
          <EditIcon />
        </button>
        <button className="action-btn delete" onClick={() => onDelete(lookbook)}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
});

LookbookCard.displayName = 'LookbookCard';

// 룩북 모달 컴포넌트
const LookbookModal = memo(({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openCloudinaryWidget = (field) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Cloudinary 환경변수가 설정되지 않았습니다.');
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: field === 'thumbnail' ? 1 : 0.75,
        croppingShowDimensions: true,
        resourceType: 'image',
        folder: 'lookbooks',
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setFormData((prev) => ({
            ...prev,
            [field]: result.info.secure_url,
          }));
        }
      }
    );
    widget.open();
  };

  const removeImage = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="lookbook-modal-overlay">
      <div className="lookbook-modal">
        <div className="lookbook-modal-header">
          <h3>{isEditing ? '룩북 수정' : '새 룩북 등록'}</h3>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="lookbook-modal-form">
          {/* 기본 정보 */}
          <div className="form-section">
            <h4>기본 정보</h4>
            <div className="form-group">
              <label>제목 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 짧은 영상을 보면서 '숏:핑'"
                required
              />
            </div>
            <div className="form-group">
              <label>설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="선택사항"
                rows={2}
              />
            </div>
          </div>

          {/* 미디어 설정 */}
          <div className="form-section">
            <h4>미디어 설정</h4>
            <div className="form-row">
              <div className="form-group">
                <label>미디어 타입</label>
                <select name="mediaType" value={formData.mediaType} onChange={handleChange}>
                  {MEDIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.mediaType === 'video' && (
                <div className="form-group">
                  <label>플랫폼</label>
                  <select name="videoPlatform" value={formData.videoPlatform} onChange={handleChange}>
                    {VIDEO_PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 썸네일 이미지 */}
            <div className="form-group">
              <label>
                썸네일 이미지 *
                <span className="size-hint">권장: 400 x 500px (비율 4:5)</span>
              </label>
              <div className="image-upload-area">
                {formData.thumbnail ? (
                  <div className="image-preview-item">
                    <img src={formData.thumbnail} alt="썸네일" />
                    <button type="button" className="remove-image-btn" onClick={() => removeImage('thumbnail')}>
                      <CloseIcon />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="upload-btn" onClick={() => openCloudinaryWidget('thumbnail')}>
                    <PlusIcon />
                    <span>썸네일 업로드</span>
                  </button>
                )}
              </div>
            </div>

            {/* 이미지 타입인 경우 메인 이미지 */}
            {formData.mediaType === 'image' && (
              <div className="form-group">
                <label>
                  메인 이미지
                  <span className="size-hint">권장: 800 x 1000px (비율 4:5)</span>
                </label>
                <div className="image-upload-area">
                  {formData.image ? (
                    <div className="image-preview-item">
                      <img src={formData.image} alt="메인이미지" />
                      <button type="button" className="remove-image-btn" onClick={() => removeImage('image')}>
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="upload-btn" onClick={() => openCloudinaryWidget('image')}>
                      <PlusIcon />
                      <span>이미지 업로드</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 동영상 타입인 경우 URL */}
            {formData.mediaType === 'video' && (
              <div className="form-group">
                <label>동영상 URL *</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/shorts/..."
                />
                <span className="input-hint">
                  YouTube Shorts, YouTube, Instagram Reels, TikTok URL을 지원합니다.
                </span>
              </div>
            )}
          </div>

          {/* 링크 설정 */}
          <div className="form-section">
            <h4>링크 설정</h4>
            <div className="form-row">
              <div className="form-group flex-2">
                <label>연결 링크</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="클릭 시 이동할 URL (선택사항)"
                />
              </div>
              <div className="form-group flex-1">
                <label>링크 타겟</label>
                <select name="linkTarget" value={formData.linkTarget} onChange={handleChange}>
                  <option value="_self">현재 창</option>
                  <option value="_blank">새 창</option>
                </select>
              </div>
            </div>
          </div>

          {/* 상태 설정 */}
          <div className="form-section">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>활성화</span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="lookbook-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-btn">
              {isEditing ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

LookbookModal.displayName = 'LookbookModal';

// 삭제 확인 모달
const DeleteConfirmModal = memo(({ isOpen, onClose, onConfirm, lookbook }) => {
  if (!isOpen || !lookbook) return null;

  return (
    <div className="lookbook-modal-overlay">
      <div className="lookbook-modal delete-modal">
        <div className="lookbook-modal-header">
          <h3>룩북 삭제</h3>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="delete-modal-content">
          <p>정말 이 룩북을 삭제하시겠습니까?</p>
          <p className="delete-item-name">{lookbook.title}</p>
        </div>
        <div className="lookbook-modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button type="button" className="delete-btn" onClick={onConfirm}>
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmModal.displayName = 'DeleteConfirmModal';

// 메인 컴포넌트
const LookbooksContent = () => {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLookbook, setSelectedLookbook] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [draggedItem, setDraggedItem] = useState(null);

  // 룩북 목록 조회
  const fetchLookbooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 100 });
      if (filterType !== 'all') {
        params.append('mediaType', filterType);
      }
      const response = await api.get(`/lookbooks?${params.toString()}`);
      setLookbooks(response.data.data || []);
    } catch (error) {
      console.error('룩북 조회 오류:', error);
      alert('룩북 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchLookbooks();
  }, [fetchLookbooks]);

  // 필터링된 룩북
  const filteredLookbooks = lookbooks.filter((lookbook) =>
    lookbook.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 모달 열기
  const openCreateModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (lookbook) => {
    setIsEditing(true);
    setSelectedLookbook(lookbook);
    setFormData({
      title: lookbook.title || '',
      description: lookbook.description || '',
      mediaType: lookbook.mediaType || 'image',
      thumbnail: lookbook.thumbnail || '',
      image: lookbook.image || '',
      videoUrl: lookbook.videoUrl || '',
      videoPlatform: lookbook.videoPlatform || 'youtube_shorts',
      link: lookbook.link || '',
      linkTarget: lookbook.linkTarget || '_self',
      isActive: lookbook.isActive !== undefined ? lookbook.isActive : true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLookbook(null);
    setFormData(initialFormState);
  };

  // 삭제 모달
  const openDeleteModal = (lookbook) => {
    setSelectedLookbook(lookbook);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedLookbook(null);
  };

  // 폼 제출
  const handleSubmit = async (data) => {
    try {
      if (isEditing && selectedLookbook) {
        await api.put(`/lookbooks/${selectedLookbook._id}`, data);
        alert('룩북이 수정되었습니다.');
      } else {
        await api.post('/lookbooks', data);
        alert('룩북이 등록되었습니다.');
      }
      closeModal();
      fetchLookbooks();
    } catch (error) {
      console.error('룩북 저장 오류:', error);
      alert(error.response?.data?.message || '룩북 저장에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!selectedLookbook) return;

    try {
      await api.delete(`/lookbooks/${selectedLookbook._id}`);
      alert('룩북이 삭제되었습니다.');
      closeDeleteModal();
      fetchLookbooks();
    } catch (error) {
      console.error('룩북 삭제 오류:', error);
      alert('룩북 삭제에 실패했습니다.');
    }
  };

  // 활성화 토글
  const handleToggle = async (id) => {
    try {
      await api.patch(`/lookbooks/${id}/toggle`);
      fetchLookbooks();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 드래그 앤 드롭
  const handleDragStart = (e, lookbook) => {
    setDraggedItem(lookbook);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetLookbook) => {
    e.preventDefault();
    if (!draggedItem || draggedItem._id === targetLookbook._id) return;

    const items = [...filteredLookbooks];
    const draggedIndex = items.findIndex((item) => item._id === draggedItem._id);
    const targetIndex = items.findIndex((item) => item._id === targetLookbook._id);

    items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    // 순서 업데이트
    const reorderedItems = items.map((item, index) => ({
      id: item._id,
      order: index,
    }));

    try {
      await api.patch('/lookbooks/reorder', { items: reorderedItems });
      fetchLookbooks();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      alert('순서 변경에 실패했습니다.');
    }

    setDraggedItem(null);
  };

  return (
    <div className="lookbooks-content">
      {/* 상단 툴바 */}
      <div className="lookbooks-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="룩북 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="image">이미지</option>
            <option value="video">동영상</option>
          </select>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <PlusIcon />
          <span>새 룩북 추가</span>
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="lookbooks-info">
        <p>💡 드래그하여 룩북 순서를 변경할 수 있습니다.</p>
      </div>

      {/* 룩북 목록 */}
      {loading ? (
        <div className="loading-state">룩북을 불러오는 중...</div>
      ) : filteredLookbooks.length === 0 ? (
        <div className="empty-state">
          <p>등록된 룩북이 없습니다.</p>
          <button className="add-btn" onClick={openCreateModal}>
            첫 번째 룩북 추가하기
          </button>
        </div>
      ) : (
        <div className="lookbooks-grid">
          {filteredLookbooks.map((lookbook) => (
            <LookbookCard
              key={lookbook._id}
              lookbook={lookbook}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onToggle={handleToggle}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* 모달 */}
      <LookbookModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        lookbook={selectedLookbook}
      />
    </div>
  );
};

export default memo(LookbooksContent);




