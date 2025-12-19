import { memo, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useOrder } from '../hooks/useOrder'
import './OrderComplete.css'

// 가격 포맷
const formatPrice = (price) => price?.toLocaleString() || '0'

// 주문 상태 라벨
const STATUS_LABELS = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
  refunded: '환불됨',
}

function OrderComplete() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getOrderById, loading } = useOrder()
  const [order, setOrder] = useState(null)

  const orderId = location.state?.orderId
  const orderNumber = location.state?.orderNumber

  useEffect(() => {
    if (!orderId) {
      navigate('/')
      return
    }

    const fetchOrder = async () => {
      try {
        const result = await getOrderById(orderId)
        if (result.success) {
          setOrder(result.data)
        }
      } catch (error) {
        console.error('주문 조회 실패:', error)
      }
    }

    fetchOrder()
  }, [orderId, getOrderById, navigate])

  if (loading || !order) {
    return (
      <div className="order-complete-page">
        <Navbar />
        <div className="order-complete-container">
          <div className="loading">주문 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-complete-page">
      <Navbar />
      
      <div className="order-complete-container">
        {/* 완료 메시지 */}
        <div className="complete-header">
          <div className="complete-icon">✓</div>
          <h1>주문이 완료되었습니다!</h1>
          <p className="order-number">주문번호: <strong>{order.orderNumber}</strong></p>
        </div>

        {/* 주문 정보 */}
        <div className="order-info-section">
          <h2>주문 정보</h2>
          
          <div className="info-group">
            <div className="info-row">
              <span className="label">주문상태</span>
              <span className="value status">{STATUS_LABELS[order.status]}</span>
            </div>
            <div className="info-row">
              <span className="label">결제수단</span>
              <span className="value">{order.payment?.method}</span>
            </div>
            <div className="info-row">
              <span className="label">결제일시</span>
              <span className="value">
                {order.payment?.paidAt 
                  ? new Date(order.payment.paidAt).toLocaleString('ko-KR')
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 배송지 정보 */}
        <div className="order-info-section">
          <h2>배송지 정보</h2>
          
          <div className="info-group">
            <div className="info-row">
              <span className="label">수령인</span>
              <span className="value">{order.shippingAddress?.recipientName}</span>
            </div>
            <div className="info-row">
              <span className="label">연락처</span>
              <span className="value">{order.shippingAddress?.phone}</span>
            </div>
            <div className="info-row">
              <span className="label">주소</span>
              <span className="value">
                ({order.shippingAddress?.zipCode}) {order.shippingAddress?.address} {order.shippingAddress?.addressDetail}
              </span>
            </div>
            {order.shippingAddress?.deliveryRequest && (
              <div className="info-row">
                <span className="label">요청사항</span>
                <span className="value">{order.shippingAddress?.deliveryRequest}</span>
              </div>
            )}
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="order-info-section">
          <h2>주문 상품</h2>
          
          <div className="order-items">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="no-image">NO IMAGE</div>
                  )}
                </div>
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-qty">수량: {item.quantity}개</span>
                </div>
                <div className="item-price">
                  ₩{formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="order-info-section payment-summary">
          <h2>결제 금액</h2>
          
          <div className="summary-details">
            <div className="summary-row">
              <span>상품 금액</span>
              <span>₩{formatPrice(order.pricing?.itemsPrice)}</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>
                {order.pricing?.shippingPrice === 0 
                  ? '무료' 
                  : `₩${formatPrice(order.pricing?.shippingPrice)}`}
              </span>
            </div>
            {order.pricing?.discountAmount > 0 && (
              <div className="summary-row discount">
                <span>할인 금액</span>
                <span>-₩{formatPrice(order.pricing?.discountAmount)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>₩{formatPrice(order.pricing?.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="complete-actions">
          <Link to="/orders" className="btn-orders">주문 내역 보기</Link>
          <Link to="/" className="btn-continue">쇼핑 계속하기</Link>
        </div>

        {/* 안내 메시지 */}
        <div className="complete-notice">
          <h3>📦 배송 안내</h3>
          <ul>
            <li>주문하신 상품은 결제 확인 후 1-2일 이내에 출고됩니다.</li>
            <li>출고 후 배송은 2-3일 정도 소요됩니다. (도서산간 지역 제외)</li>
            <li>배송 조회는 출고 완료 후 가능합니다.</li>
          </ul>
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

export default memo(OrderComplete)

