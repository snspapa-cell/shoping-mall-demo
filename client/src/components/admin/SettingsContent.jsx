import { memo, useState, useEffect, useCallback } from 'react'
import api from '../../utils/axios'
import './SettingsContent.css'

// 설정 섹션 컴포넌트
const SettingsSection = memo(({ title, description, children }) => (
  <div className="settings-section">
    <div className="section-header">
      <h3>{title}</h3>
      {description && <p className="section-description">{description}</p>}
    </div>
    <div className="section-content">
      {children}
    </div>
  </div>
))

// 토글 스위치 컴포넌트
const ToggleSwitch = memo(({ id, checked, onChange, disabled }) => (
  <label className="toggle-switch">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span className="toggle-slider" />
  </label>
))

// 사이트 설정 페이지
function SettingsContent() {
  // 일반 설정
  const [generalSettings, setGeneralSettings] = useState({
    siteName: '성찬몰',
    siteDescription: '트렌디한 패션 쇼핑몰',
    contactEmail: 'support@sungchanmall.com',
    contactPhone: '1234-5678',
    businessHours: '평일 09:00 - 18:00',
  })

  // 배송 설정
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 50000,
    baseShippingFee: 3000,
    jejuExtraFee: 3000,
    mountainExtraFee: 5000,
  })

  // 주문 설정
  const [orderSettings, setOrderSettings] = useState({
    maxQuantityPerProduct: 99,
    allowGuestCheckout: false,
    requirePhoneVerification: false,
    autoConfirmDays: 7,
  })

  // 알림 설정
  const [notificationSettings, setNotificationSettings] = useState({
    emailOrderConfirmation: true,
    emailShippingUpdate: true,
    emailPromotion: false,
    smsOrderConfirmation: false,
    smsShippingUpdate: true,
  })

  // 유지보수 설정
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: '사이트 점검 중입니다. 잠시 후 다시 시도해주세요.',
  })

  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // 일반 설정 변경 핸들러
  const handleGeneralChange = useCallback((field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }))
  }, [])

  // 배송 설정 변경 핸들러
  const handleShippingChange = useCallback((field, value) => {
    setShippingSettings(prev => ({ ...prev, [field]: Number(value) || 0 }))
  }, [])

  // 주문 설정 변경 핸들러
  const handleOrderChange = useCallback((field, value) => {
    setOrderSettings(prev => ({ ...prev, [field]: typeof value === 'boolean' ? value : Number(value) || 0 }))
  }, [])

  // 알림 설정 변경 핸들러
  const handleNotificationChange = useCallback((field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
  }, [])

  // 유지보수 설정 변경 핸들러
  const handleMaintenanceChange = useCallback((field, value) => {
    setMaintenanceSettings(prev => ({ ...prev, [field]: value }))
  }, [])

  // 설정 저장
  const handleSave = useCallback(async () => {
    setLoading(true)
    setSaveStatus(null)

    try {
      // 실제로는 API 호출
      // await api.put('/settings', {
      //   general: generalSettings,
      //   shipping: shippingSettings,
      //   order: orderSettings,
      //   notification: notificationSettings,
      //   maintenance: maintenanceSettings,
      // })

      // 임시로 로컬 스토리지에 저장
      localStorage.setItem('siteSettings', JSON.stringify({
        general: generalSettings,
        shipping: shippingSettings,
        order: orderSettings,
        notification: notificationSettings,
        maintenance: maintenanceSettings,
      }))

      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('설정 저장 실패:', error)
      setSaveStatus('error')
    } finally {
      setLoading(false)
    }
  }, [generalSettings, shippingSettings, orderSettings, notificationSettings, maintenanceSettings])

  // 설정 초기화
  const handleReset = useCallback(() => {
    if (window.confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      setGeneralSettings({
        siteName: '성찬몰',
        siteDescription: '트렌디한 패션 쇼핑몰',
        contactEmail: 'support@sungchanmall.com',
        contactPhone: '1234-5678',
        businessHours: '평일 09:00 - 18:00',
      })
      setShippingSettings({
        freeShippingThreshold: 50000,
        baseShippingFee: 3000,
        jejuExtraFee: 3000,
        mountainExtraFee: 5000,
      })
      setOrderSettings({
        maxQuantityPerProduct: 99,
        allowGuestCheckout: false,
        requirePhoneVerification: false,
        autoConfirmDays: 7,
      })
      setNotificationSettings({
        emailOrderConfirmation: true,
        emailShippingUpdate: true,
        emailPromotion: false,
        smsOrderConfirmation: false,
        smsShippingUpdate: true,
      })
      setMaintenanceSettings({
        maintenanceMode: false,
        maintenanceMessage: '사이트 점검 중입니다. 잠시 후 다시 시도해주세요.',
      })
      setSaveStatus('reset')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }, [])

  // 저장된 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('siteSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.general) setGeneralSettings(parsed.general)
        if (parsed.shipping) setShippingSettings(parsed.shipping)
        if (parsed.order) setOrderSettings(parsed.order)
        if (parsed.notification) setNotificationSettings(parsed.notification)
        if (parsed.maintenance) setMaintenanceSettings(parsed.maintenance)
      } catch (e) {
        console.error('설정 로드 실패:', e)
      }
    }
  }, [])

  return (
    <div className="settings-content">
      {/* 저장 상태 알림 */}
      {saveStatus && (
        <div className={`save-notification ${saveStatus}`}>
          {saveStatus === 'success' && '✓ 설정이 저장되었습니다.'}
          {saveStatus === 'error' && '✗ 설정 저장에 실패했습니다.'}
          {saveStatus === 'reset' && '↺ 설정이 초기화되었습니다.'}
        </div>
      )}

      {/* 일반 설정 */}
      <SettingsSection title="일반 설정" description="사이트 기본 정보를 설정합니다.">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="siteName">사이트 이름</label>
            <input
              type="text"
              id="siteName"
              value={generalSettings.siteName}
              onChange={(e) => handleGeneralChange('siteName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="siteDescription">사이트 설명</label>
            <input
              type="text"
              id="siteDescription"
              value={generalSettings.siteDescription}
              onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactEmail">대표 이메일</label>
            <input
              type="email"
              id="contactEmail"
              value={generalSettings.contactEmail}
              onChange={(e) => handleGeneralChange('contactEmail', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactPhone">대표 전화번호</label>
            <input
              type="text"
              id="contactPhone"
              value={generalSettings.contactPhone}
              onChange={(e) => handleGeneralChange('contactPhone', e.target.value)}
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="businessHours">영업시간</label>
            <input
              type="text"
              id="businessHours"
              value={generalSettings.businessHours}
              onChange={(e) => handleGeneralChange('businessHours', e.target.value)}
            />
          </div>
        </div>
      </SettingsSection>

      {/* 배송 설정 */}
      <SettingsSection title="배송 설정" description="배송비 및 배송 관련 설정을 관리합니다.">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="freeShippingThreshold">무료배송 기준 금액 (원)</label>
            <input
              type="number"
              id="freeShippingThreshold"
              value={shippingSettings.freeShippingThreshold}
              onChange={(e) => handleShippingChange('freeShippingThreshold', e.target.value)}
            />
            <span className="form-hint">이 금액 이상 주문 시 무료배송</span>
          </div>
          <div className="form-group">
            <label htmlFor="baseShippingFee">기본 배송비 (원)</label>
            <input
              type="number"
              id="baseShippingFee"
              value={shippingSettings.baseShippingFee}
              onChange={(e) => handleShippingChange('baseShippingFee', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="jejuExtraFee">제주도 추가 배송비 (원)</label>
            <input
              type="number"
              id="jejuExtraFee"
              value={shippingSettings.jejuExtraFee}
              onChange={(e) => handleShippingChange('jejuExtraFee', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="mountainExtraFee">도서산간 추가 배송비 (원)</label>
            <input
              type="number"
              id="mountainExtraFee"
              value={shippingSettings.mountainExtraFee}
              onChange={(e) => handleShippingChange('mountainExtraFee', e.target.value)}
            />
          </div>
        </div>
      </SettingsSection>

      {/* 주문 설정 */}
      <SettingsSection title="주문 설정" description="주문 관련 정책을 설정합니다.">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="maxQuantityPerProduct">상품당 최대 주문 수량</label>
            <input
              type="number"
              id="maxQuantityPerProduct"
              value={orderSettings.maxQuantityPerProduct}
              onChange={(e) => handleOrderChange('maxQuantityPerProduct', e.target.value)}
              min="1"
              max="999"
            />
          </div>
          <div className="form-group">
            <label htmlFor="autoConfirmDays">자동 구매확정 기간 (일)</label>
            <input
              type="number"
              id="autoConfirmDays"
              value={orderSettings.autoConfirmDays}
              onChange={(e) => handleOrderChange('autoConfirmDays', e.target.value)}
              min="1"
              max="30"
            />
            <span className="form-hint">배송완료 후 자동으로 구매확정되는 일수</span>
          </div>
          <div className="form-group toggle-group">
            <div className="toggle-label">
              <span>비회원 주문 허용</span>
              <p className="toggle-description">비회원도 주문할 수 있도록 허용합니다.</p>
            </div>
            <ToggleSwitch
              id="allowGuestCheckout"
              checked={orderSettings.allowGuestCheckout}
              onChange={(e) => handleOrderChange('allowGuestCheckout', e.target.checked)}
            />
          </div>
          <div className="form-group toggle-group">
            <div className="toggle-label">
              <span>휴대폰 인증 필수</span>
              <p className="toggle-description">주문 시 휴대폰 인증을 필수로 요구합니다.</p>
            </div>
            <ToggleSwitch
              id="requirePhoneVerification"
              checked={orderSettings.requirePhoneVerification}
              onChange={(e) => handleOrderChange('requirePhoneVerification', e.target.checked)}
            />
          </div>
        </div>
      </SettingsSection>

      {/* 알림 설정 */}
      <SettingsSection title="알림 설정" description="고객 알림 발송 설정을 관리합니다.">
        <div className="notification-grid">
          <div className="notification-category">
            <h4>이메일 알림</h4>
            <div className="toggle-list">
              <div className="toggle-item">
                <div className="toggle-label">
                  <span>주문 확인</span>
                </div>
                <ToggleSwitch
                  id="emailOrderConfirmation"
                  checked={notificationSettings.emailOrderConfirmation}
                  onChange={(e) => handleNotificationChange('emailOrderConfirmation', e.target.checked)}
                />
              </div>
              <div className="toggle-item">
                <div className="toggle-label">
                  <span>배송 상태 변경</span>
                </div>
                <ToggleSwitch
                  id="emailShippingUpdate"
                  checked={notificationSettings.emailShippingUpdate}
                  onChange={(e) => handleNotificationChange('emailShippingUpdate', e.target.checked)}
                />
              </div>
              <div className="toggle-item">
                <div className="toggle-label">
                  <span>프로모션 및 이벤트</span>
                </div>
                <ToggleSwitch
                  id="emailPromotion"
                  checked={notificationSettings.emailPromotion}
                  onChange={(e) => handleNotificationChange('emailPromotion', e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="notification-category">
            <h4>SMS 알림</h4>
            <div className="toggle-list">
              <div className="toggle-item">
                <div className="toggle-label">
                  <span>주문 확인</span>
                </div>
                <ToggleSwitch
                  id="smsOrderConfirmation"
                  checked={notificationSettings.smsOrderConfirmation}
                  onChange={(e) => handleNotificationChange('smsOrderConfirmation', e.target.checked)}
                />
              </div>
              <div className="toggle-item">
                <div className="toggle-label">
                  <span>배송 상태 변경</span>
                </div>
                <ToggleSwitch
                  id="smsShippingUpdate"
                  checked={notificationSettings.smsShippingUpdate}
                  onChange={(e) => handleNotificationChange('smsShippingUpdate', e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 유지보수 설정 */}
      <SettingsSection title="유지보수 설정" description="사이트 점검 모드를 관리합니다.">
        <div className="maintenance-settings">
          <div className="form-group toggle-group maintenance-toggle">
            <div className="toggle-label">
              <span>점검 모드 활성화</span>
              <p className="toggle-description warning">
                활성화하면 관리자를 제외한 모든 사용자가 사이트에 접근할 수 없습니다.
              </p>
            </div>
            <ToggleSwitch
              id="maintenanceMode"
              checked={maintenanceSettings.maintenanceMode}
              onChange={(e) => handleMaintenanceChange('maintenanceMode', e.target.checked)}
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="maintenanceMessage">점검 안내 메시지</label>
            <textarea
              id="maintenanceMessage"
              value={maintenanceSettings.maintenanceMessage}
              onChange={(e) => handleMaintenanceChange('maintenanceMessage', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </SettingsSection>

      {/* 저장 버튼 */}
      <div className="settings-actions">
        <button 
          className="btn-reset" 
          onClick={handleReset}
          disabled={loading}
        >
          초기화
        </button>
        <button 
          className="btn-save" 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  )
}

export default memo(SettingsContent)



