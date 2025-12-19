import { useState, useCallback } from 'react'
import api from '../utils/axios'

export const useOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 주문 생성
  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/orders', orderData)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '주문 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 내 주문 목록 조회
  const getMyOrders = useCallback(async (page = 1, limit = 10, status = '') => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page, limit })
      if (status) params.append('status', status)
      const response = await api.get(`/orders/my?${params}`)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '주문 목록 조회에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 주문 상세 조회
  const getOrderById = useCallback(async (orderId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '주문 조회에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 결제 완료 처리
  const payOrder = useCallback(async (orderId, transactionId = '') => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.put(`/orders/${orderId}/pay`, { transactionId })
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '결제 처리에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 주문 취소
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.put(`/orders/${orderId}/cancel`, { reason })
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '주문 취소에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createOrder,
    getMyOrders,
    getOrderById,
    payOrder,
    cancelOrder,
  }
}

export default useOrder

