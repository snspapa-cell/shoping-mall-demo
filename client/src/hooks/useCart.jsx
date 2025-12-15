import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../utils/axios'
import { useAuth } from './useAuth'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 장바구니 조회
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], totalItems: 0, totalAmount: 0 })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/cart')
      setCart(response.data.data)
    } catch (err) {
      console.error('장바구니 조회 실패:', err)
      setError('장바구니를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // 로그인 상태 변경 시 장바구니 조회
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // 장바구니에 상품 추가
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('로그인이 필요합니다.')
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/cart/items', { productId, quantity })
      setCart(response.data.data)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '장바구니 추가에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // 수량 변경
  const updateQuantity = useCallback(async (productId, quantity) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.put(`/cart/items/${productId}`, { quantity })
      setCart(response.data.data)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '수량 변경에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 상품 삭제
  const removeFromCart = useCallback(async (productId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.delete(`/cart/items/${productId}`)
      setCart(response.data.data)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '상품 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 선택 상품 삭제
  const removeSelectedItems = useCallback(async (productIds) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/cart/remove-selected', { productIds })
      setCart(response.data.data)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '상품 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 장바구니 비우기
  const clearCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.delete('/cart')
      setCart(response.data.data)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || '장바구니 비우기에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    removeSelectedItems,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default useCart

