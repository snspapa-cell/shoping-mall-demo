import { useState, useCallback, useEffect, useMemo, memo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useOrder } from '../hooks/useOrder'
import api from '../utils/axios'
import './Checkout.css'

// 가격 포맷
const formatPrice = (price) => price?.toLocaleString() || '0'

// 포트원 고객사 식별 코드
const IMP_CODE = 'imp12501636'

// 결제 수단 옵션
const PAYMENT_METHODS = [
  { id: 'card', name: '신용/체크카드', icon: '💳' },
  { id: 'bank', name: '무통장입금', icon: '🏦' },
  { id: 'kakao', name: '카카오페이', icon: '💛' },
  { id: 'naver', name: '네이버페이', icon: '💚' },
  { id: 'toss', name: '토스페이', icon: '💙' },
]

// 배송 요청사항 옵션
const DELIVERY_REQUESTS = [
  '배송 전 연락 바랍니다',
  '부재시 문 앞에 놓아주세요',
  '부재시 경비실에 맡겨주세요',
  '부재시 택배함에 넣어주세요',
  '직접 입력',
]

// 주문 상품 아이템 컴포넌트
const OrderItem = memo(({ item }) => {
  const product = item.product || item
  
  return (
    <div className="order-item">
      <div className="item-image">
        {product.images?.[0] || item.image ? (
          <img src={product.images?.[0] || item.image} alt={product.name || item.name} />
        ) : (
          <div className="no-image">NO IMAGE</div>
        )}
      </div>
      <div className="item-details">
        <span className="item-name">{product.name || item.name}</span>
        <span className="item-option">수량: {item.quantity}개</span>
      </div>
      <div className="item-price">
        ₩{formatPrice((product.price || item.price) * item.quantity)}
      </div>
    </div>
  )
})

// 배송지 입력 폼 컴포넌트
const ShippingForm = memo(({ formData, onChange, errors, savedAddresses, onSelectAddress, onSaveAddress }) => {
  const [customRequest, setCustomRequest] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showAddressList, setShowAddressList] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  const handleRequestChange = (e) => {
    const value = e.target.value
    if (value === '직접 입력') {
      setShowCustomInput(true)
      onChange({ target: { name: 'deliveryRequest', value: customRequest } })
    } else {
      setShowCustomInput(false)
      onChange({ target: { name: 'deliveryRequest', value } })
    }
  }

  const handleCustomRequestChange = (e) => {
    const value = e.target.value
    setCustomRequest(value)
    onChange({ target: { name: 'deliveryRequest', value } })
  }

  // 다음 주소 검색
  const handleSearchAddress = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침 해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        // 도로명 주소 우선, 없으면 지번 주소 사용
        const address = data.roadAddress || data.jibunAddress
        
        // 우편번호 설정
        onChange({ target: { name: 'zipCode', value: data.zonecode } })
        // 기본주소 설정
        onChange({ target: { name: 'address', value: address } })
        
        // 상세주소 입력란에 포커스
        setTimeout(() => {
          document.getElementById('addressDetail')?.focus()
        }, 100)
      },
      width: '100%',
      height: '100%',
    }).open({
      popupTitle: '주소 검색',
      popupKey: 'checkout-address-search',
    })
  }

  // 저장된 배송지 선택
  const handleSelectSavedAddress = (address) => {
    onSelectAddress(address)
    setShowAddressList(false)
  }

  // 현재 배송지 저장
  const handleSaveCurrentAddress = () => {
    onSaveAddress(saveAsDefault)
  }

  return (
    <div className="checkout-section shipping-section">
      <div className="section-title-row">
        <h2 className="section-title">배송지 정보</h2>
        {savedAddresses && savedAddresses.length > 0 && (
          <button 
            type="button" 
            className="btn-address-list"
            onClick={() => setShowAddressList(!showAddressList)}
          >
            {showAddressList ? '닫기' : '저장된 배송지'}
          </button>
        )}
      </div>

      {/* 저장된 배송지 목록 */}
      {showAddressList && savedAddresses && savedAddresses.length > 0 && (
        <div className="saved-addresses-list">
          {savedAddresses.map((addr) => (
            <div 
              key={addr._id} 
              className={`saved-address-item ${addr.isDefault ? 'default' : ''}`}
              onClick={() => handleSelectSavedAddress(addr)}
            >
              <div className="address-header">
                <span className="address-name">{addr.name || '배송지'}</span>
                {addr.isDefault && <span className="default-badge">기본</span>}
              </div>
              <p className="address-recipient">{addr.recipientName} / {addr.phone}</p>
              <p className="address-text">({addr.zipCode}) {addr.address} {addr.addressDetail}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="recipientName">수령인 *</label>
        <input
          type="text"
          id="recipientName"
          name="recipientName"
          value={formData.recipientName}
          onChange={onChange}
          placeholder="수령인 이름을 입력하세요"
          className={errors.recipientName ? 'error' : ''}
        />
        {errors.recipientName && <span className="error-message">{errors.recipientName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">연락처 *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="'-' 없이 입력하세요"
          className={errors.phone ? 'error' : ''}
        />
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      <div className="form-row">
        <div className="form-group zipcode-group">
          <label htmlFor="zipCode">우편번호 *</label>
          <div className="zipcode-input">
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={onChange}
              placeholder="우편번호"
              className={errors.zipCode ? 'error' : ''}
              readOnly
            />
            <button type="button" className="btn-search-address" onClick={handleSearchAddress}>
              주소 검색
            </button>
          </div>
          {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="address">기본주소 *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="주소 검색 버튼을 클릭하세요"
          className={errors.address ? 'error' : ''}
          readOnly
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="addressDetail">상세주소</label>
        <input
          type="text"
          id="addressDetail"
          name="addressDetail"
          value={formData.addressDetail}
          onChange={onChange}
          placeholder="상세 주소를 입력하세요 (동/호수 등)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="deliveryRequest">배송 요청사항</label>
        <select
          id="deliveryRequestSelect"
          onChange={handleRequestChange}
          defaultValue=""
        >
          <option value="">선택하세요</option>
          {DELIVERY_REQUESTS.map((request) => (
            <option key={request} value={request}>{request}</option>
          ))}
        </select>
        {showCustomInput && (
          <input
            type="text"
            id="deliveryRequest"
            name="deliveryRequest"
            value={customRequest}
            onChange={handleCustomRequestChange}
            placeholder="배송 요청사항을 입력하세요"
            className="custom-request-input"
          />
        )}
      </div>

      {/* 배송지 저장 옵션 */}
      <div className="save-address-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
          />
          <span>이 배송지를 기본 배송지로 저장</span>
        </label>
        <button 
          type="button" 
          className="btn-save-address"
          onClick={handleSaveCurrentAddress}
        >
          배송지 저장
        </button>
      </div>
    </div>
  )
})

// 결제 수단 선택 컴포넌트
const PaymentMethodSelector = memo(({ selected, onChange, error }) => (
  <div className="checkout-section payment-section">
    <h2 className="section-title">결제 수단</h2>
    <div className="payment-methods">
      {PAYMENT_METHODS.map((method) => (
        <label
          key={method.id}
          className={`payment-method ${selected === method.id ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={selected === method.id}
            onChange={() => onChange(method.id)}
          />
          <span className="method-icon">{method.icon}</span>
          <span className="method-name">{method.name}</span>
        </label>
      ))}
    </div>
    {error && <span className="error-message">{error}</span>}
  </div>
))

// 주문 요약 컴포넌트
const OrderSummary = memo(({ pricing, itemCount }) => (
  <div className="checkout-section summary-section">
    <h2 className="section-title">결제 금액</h2>
    <div className="summary-details">
      <div className="summary-row">
        <span>상품 금액 ({itemCount}개)</span>
        <span>₩{formatPrice(pricing.itemsPrice)}</span>
      </div>
      <div className="summary-row">
        <span>배송비</span>
        <span>{pricing.shippingPrice === 0 ? '무료' : `₩${formatPrice(pricing.shippingPrice)}`}</span>
      </div>
      {pricing.discountAmount > 0 && (
        <div className="summary-row discount">
          <span>할인 금액</span>
          <span>-₩{formatPrice(pricing.discountAmount)}</span>
        </div>
      )}
      <div className="summary-row total">
        <span>총 결제 금액</span>
        <span className="total-price">₩{formatPrice(pricing.totalPrice)}</span>
      </div>
    </div>
    {pricing.itemsPrice >= 50000 && (
      <p className="free-shipping-notice">✓ 5만원 이상 구매로 무료배송!</p>
    )}
  </div>
))

// 약관 동의 컴포넌트
const AgreementSection = memo(({ agreements, onChange, error }) => (
  <div className="checkout-section agreement-section">
    <h2 className="section-title">약관 동의</h2>
    <div className="agreement-list">
      <label className="agreement-item all">
        <input
          type="checkbox"
          checked={agreements.all}
          onChange={() => onChange('all')}
        />
        <span>전체 동의</span>
      </label>
      <div className="agreement-divider"></div>
      <label className="agreement-item">
        <input
          type="checkbox"
          checked={agreements.terms}
          onChange={() => onChange('terms')}
        />
        <span>[필수] 구매조건 확인 및 결제 진행 동의</span>
      </label>
      <label className="agreement-item">
        <input
          type="checkbox"
          checked={agreements.privacy}
          onChange={() => onChange('privacy')}
        />
        <span>[필수] 개인정보 수집 및 이용 동의</span>
      </label>
      <label className="agreement-item">
        <input
          type="checkbox"
          checked={agreements.marketing}
          onChange={() => onChange('marketing')}
        />
        <span>[선택] 마케팅 활용 동의</span>
      </label>
    </div>
    {error && <span className="error-message">{error}</span>}
  </div>
))

function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const { cart, fetchCart } = useCart()
  const { createOrder, payOrder, cancelOrder, loading: orderLoading } = useOrder()

  // URL state에서 선택된 상품 가져오기 (장바구니에서 넘어온 경우)
  const selectedProductIds = location.state?.selectedItems || []
  const directBuyItem = location.state?.directBuy // 바로구매인 경우

  // 주문 상품 목록
  const orderItems = useMemo(() => {
    if (directBuyItem) {
      return [directBuyItem]
    }
    if (selectedProductIds.length > 0) {
      return cart.items.filter(item => 
        selectedProductIds.includes(item.product?._id)
      )
    }
    return cart.items
  }, [cart.items, selectedProductIds, directBuyItem])

  // 저장된 배송지 목록
  const [savedAddresses, setSavedAddresses] = useState([])

  // 배송지 정보 상태
  const [shippingData, setShippingData] = useState({
    recipientName: user?.username || '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    deliveryRequest: '',
  })

  // 결제 수단 상태
  const [paymentMethod, setPaymentMethod] = useState('')

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  })

  // 에러 상태
  const [errors, setErrors] = useState({})

  // 가격 계산
  const pricing = useMemo(() => {
    const itemsPrice = orderItems.reduce((total, item) => {
      const price = item.product?.price || item.price || 0
      return total + price * item.quantity
    }, 0)
    const shippingPrice = itemsPrice >= 50000 ? 0 : 3000
    const discountAmount = 0
    const totalPrice = itemsPrice + shippingPrice - discountAmount

    return { itemsPrice, shippingPrice, discountAmount, totalPrice }
  }, [orderItems])

  // 총 상품 개수
  const totalItemCount = useMemo(() => {
    return orderItems.reduce((total, item) => total + item.quantity, 0)
  }, [orderItems])

  // 포트원 결제 모듈 초기화
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init(IMP_CODE)
      console.log('포트원 결제 모듈 초기화 완료')
    } else {
      console.error('포트원 SDK를 불러올 수 없습니다.')
    }
  }, [])

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }, [isAuthenticated, navigate])

  // 장바구니 새로고침
  useEffect(() => {
    if (isAuthenticated && !directBuyItem) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart, directBuyItem])

  // 저장된 배송지 및 기본 배송지 조회
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!isAuthenticated) return
      
      try {
        // 저장된 배송지 목록 조회
        const response = await api.get('/shipping-addresses')
        const addresses = response.data.data || []
        setSavedAddresses(addresses)

        // 기본 배송지가 있으면 자동 입력
        const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0]
        if (defaultAddr) {
          setShippingData(prev => ({
            ...prev,
            recipientName: defaultAddr.recipientName || prev.recipientName,
            phone: defaultAddr.phone || prev.phone,
            zipCode: defaultAddr.zipCode || prev.zipCode,
            address: defaultAddr.address || prev.address,
            addressDetail: defaultAddr.addressDetail || prev.addressDetail,
          }))
        }
      } catch (error) {
        console.error('배송지 조회 실패:', error)
      }
    }

    fetchSavedAddresses()
  }, [isAuthenticated])

  // 배송지 정보 변경
  const handleShippingChange = useCallback((e) => {
    const { name, value } = e.target
    setShippingData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }, [])

  // 저장된 배송지 선택
  const handleSelectAddress = useCallback((address) => {
    setShippingData({
      recipientName: address.recipientName || '',
      phone: address.phone || '',
      zipCode: address.zipCode || '',
      address: address.address || '',
      addressDetail: address.addressDetail || '',
      deliveryRequest: '',
    })
    setErrors({})
  }, [])

  // 현재 배송지 저장
  const handleSaveAddress = useCallback(async (isDefault) => {
    if (!shippingData.recipientName || !shippingData.phone || !shippingData.zipCode || !shippingData.address) {
      alert('수령인, 연락처, 우편번호, 주소는 필수입니다.')
      return
    }

    try {
      const response = await api.post('/shipping-addresses', {
        name: '배송지',
        recipientName: shippingData.recipientName,
        phone: shippingData.phone,
        zipCode: shippingData.zipCode,
        address: shippingData.address,
        addressDetail: shippingData.addressDetail,
        isDefault,
      })

      setSavedAddresses(response.data.data)
      alert('배송지가 저장되었습니다.')
    } catch (error) {
      alert(error.response?.data?.message || '배송지 저장에 실패했습니다.')
    }
  }, [shippingData])

  // 결제 수단 변경
  const handlePaymentChange = useCallback((method) => {
    setPaymentMethod(method)
    setErrors(prev => ({ ...prev, paymentMethod: '' }))
  }, [])

  // 약관 동의 변경
  const handleAgreementChange = useCallback((key) => {
    if (key === 'all') {
      const newValue = !agreements.all
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue,
      })
    } else {
      setAgreements(prev => {
        const updated = { ...prev, [key]: !prev[key] }
        updated.all = updated.terms && updated.privacy && updated.marketing
        return updated
      })
    }
    setErrors(prev => ({ ...prev, agreement: '' }))
  }, [agreements.all])

  // 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!shippingData.recipientName.trim()) {
      newErrors.recipientName = '수령인 이름을 입력해주세요.'
    }

    if (!shippingData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.'
    } else if (!/^01[0-9]{8,9}$/.test(shippingData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 연락처를 입력해주세요.'
    }

    if (!shippingData.zipCode.trim()) {
      newErrors.zipCode = '우편번호를 입력해주세요.'
    }

    if (!shippingData.address.trim()) {
      newErrors.address = '주소를 입력해주세요.'
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = '결제 수단을 선택해주세요.'
    }

    if (!agreements.terms || !agreements.privacy) {
      newErrors.agreement = '필수 약관에 동의해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [shippingData, paymentMethod, agreements])

  // PG사 매핑
  const getPgProvider = useCallback((method) => {
    const pgMap = {
      card: 'html5_inicis',      // 이니시스 (신용카드)
      bank: 'html5_inicis',      // 이니시스 (실시간계좌이체)
      kakao: 'kakaopay',         // 카카오페이
      naver: 'naverpay',         // 네이버페이
      toss: 'tosspay',           // 토스페이
    }
    return pgMap[method] || 'html5_inicis'
  }, [])

  // 결제 수단 매핑
  const getPayMethod = useCallback((method) => {
    const methodMap = {
      card: 'card',
      bank: 'trans',
      kakao: 'card',
      naver: 'card',
      toss: 'card',
    }
    return methodMap[method] || 'card'
  }, [])

  // 포트원 결제 요청
  const requestPayment = useCallback((order) => {
    return new Promise((resolve, reject) => {
      if (!window.IMP) {
        reject(new Error('포트원 SDK를 불러올 수 없습니다.'))
        return
      }

      const firstItem = orderItems[0]
      const itemName = orderItems.length > 1
        ? `${firstItem.product?.name || firstItem.name} 외 ${orderItems.length - 1}건`
        : firstItem.product?.name || firstItem.name

      window.IMP.request_pay(
        {
          pg: getPgProvider(paymentMethod),
          pay_method: getPayMethod(paymentMethod),
          merchant_uid: order.orderNumber, // 주문번호
          name: itemName,
          amount: order.pricing.totalPrice,
          buyer_email: user?.email || '',
          buyer_name: shippingData.recipientName,
          buyer_tel: shippingData.phone.replace(/-/g, ''),
          buyer_addr: `${shippingData.address} ${shippingData.addressDetail}`,
          buyer_postcode: shippingData.zipCode,
        },
        (response) => {
          if (response.success) {
            resolve({
              success: true,
              imp_uid: response.imp_uid,
              merchant_uid: response.merchant_uid,
            })
          } else {
            reject(new Error(response.error_msg || '결제에 실패했습니다.'))
          }
        }
      )
    })
  }, [orderItems, paymentMethod, user, shippingData, getPgProvider, getPayMethod])

  // 주문하기
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      // 첫 번째 에러로 스크롤
      const firstError = document.querySelector('.error-message')
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    let createdOrderId = null

    try {
      // 주문 데이터 구성
      const orderData = {
        shippingAddress: {
          recipientName: shippingData.recipientName,
          phone: shippingData.phone.replace(/-/g, ''),
          zipCode: shippingData.zipCode,
          address: shippingData.address,
          addressDetail: shippingData.addressDetail,
          deliveryRequest: shippingData.deliveryRequest,
        },
        paymentMethod,
      }

      // 바로구매인 경우
      if (directBuyItem) {
        orderData.items = [{
          productId: directBuyItem.product?._id || directBuyItem._id,
          quantity: directBuyItem.quantity,
        }]
      } else {
        // 장바구니에서 주문하는 경우
        orderData.useCart = true
        // 선택된 상품 ID 전달
        if (selectedProductIds.length > 0) {
          orderData.selectedItems = selectedProductIds
        }
      }

      // 1. 주문 생성 (결제대기 상태)
      const result = await createOrder(orderData)

      if (!result.success) {
        throw new Error(result.message || '주문 생성에 실패했습니다.')
      }

      createdOrderId = result.data._id

      // 2. 포트원 결제 요청
      const paymentResult = await requestPayment(result.data)

      // 3. 결제 완료 처리 (서버에 결제 정보 전송)
      await payOrder(result.data._id, paymentResult.imp_uid)

      alert('결제가 완료되었습니다!')
      navigate('/order/complete', { 
        state: { 
          orderId: result.data._id,
          orderNumber: result.data.orderNumber 
        } 
      })
    } catch (error) {
      // 결제 실패/취소 시 생성된 주문 취소 처리
      if (createdOrderId) {
        try {
          await cancelOrder(createdOrderId, '결제 취소/실패')
          console.log('주문이 취소되었습니다.')
        } catch (cancelError) {
          console.error('주문 취소 실패:', cancelError)
        }
      }
      
      // 사용자에게 안내 메시지
      const errorMessage = error.message || '결제 중 오류가 발생했습니다.'
      if (errorMessage.includes('취소') || errorMessage.includes('cancel')) {
        alert('결제가 취소되었습니다. 다시 시도해 주세요.')
      } else {
        alert(errorMessage)
      }
    }
  }, [validateForm, shippingData, paymentMethod, directBuyItem, selectedProductIds, createOrder, requestPayment, payOrder, cancelOrder, navigate])

  // 주문 상품이 없는 경우
  if (!isAuthenticated) {
    return null
  }

  if (orderItems.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-container">
          <div className="empty-order">
            <div className="empty-icon">📦</div>
            <h2>주문할 상품이 없습니다</h2>
            <p>장바구니에서 상품을 선택해주세요.</p>
            <Link to="/cart" className="btn-to-cart">장바구니로 이동</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Navbar />
      
      <div className="checkout-container">
        <h1 className="checkout-title">주문/결제</h1>

        <div className="checkout-content">
          {/* 왼쪽: 주문 정보 입력 */}
          <div className="checkout-main">
            {/* 주문 상품 */}
            <div className="checkout-section order-items-section">
              <h2 className="section-title">
                주문 상품 <span className="item-count">{totalItemCount}개</span>
              </h2>
              <div className="order-items-list">
                {orderItems.map((item, index) => (
                  <OrderItem key={item._id || index} item={item} />
                ))}
              </div>
            </div>

            {/* 배송지 정보 */}
            <ShippingForm
              formData={shippingData}
              onChange={handleShippingChange}
              errors={errors}
              savedAddresses={savedAddresses}
              onSelectAddress={handleSelectAddress}
              onSaveAddress={handleSaveAddress}
            />

            {/* 결제 수단 */}
            <PaymentMethodSelector
              selected={paymentMethod}
              onChange={handlePaymentChange}
              error={errors.paymentMethod}
            />

            {/* 약관 동의 */}
            <AgreementSection
              agreements={agreements}
              onChange={handleAgreementChange}
              error={errors.agreement}
            />
          </div>

          {/* 오른쪽: 결제 요약 */}
          <div className="checkout-sidebar">
            <div className="sidebar-sticky">
              <OrderSummary pricing={pricing} itemCount={totalItemCount} />
              
              <button
                className="btn-submit-order"
                onClick={handleSubmit}
                disabled={orderLoading}
              >
                {orderLoading ? '처리 중...' : `₩${formatPrice(pricing.totalPrice)} 결제하기`}
              </button>

              <p className="order-notice">
                위 주문 내용을 확인하였으며, 결제에 동의합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>CUSTOMER CENTER</h4>
            <p className="phone">1234-5678</p>
            <p>평일 09:00 - 18:00</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 성찬몰. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default memo(Checkout)

