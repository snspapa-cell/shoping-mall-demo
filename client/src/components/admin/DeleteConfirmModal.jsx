import { memo } from 'react'
import { CloseIcon } from '../icons/AdminIcons'

// 삭제 확인 모달 컴포넌트
function DeleteConfirmModal({ isOpen, onClose, onConfirm, productName, loading }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>상품 삭제</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="delete-confirm-body">
          <p>정말로 이 상품을 삭제하시겠습니까?</p>
          <p className="product-name-confirm">{productName}</p>
          <p className="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button className="btn-delete" onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(DeleteConfirmModal)

