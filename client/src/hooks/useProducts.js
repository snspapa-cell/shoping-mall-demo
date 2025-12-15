import { useState, useCallback } from 'react'
import api from '../utils/axios'

// 상품 관리 커스텀 훅
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    count: 0,
  })

  // 상품 목록 조회
  const fetchProducts = useCallback(async (categoryFilter = '', page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      params.append('page', page)
      
      const response = await api.get(`/products?${params.toString()}`)
      setProducts(response.data.data || [])
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        count: response.data.count || 0,
      })
    } catch (err) {
      setError('상품 목록 조회에 실패했습니다.')
      console.error('상품 목록 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 상품 생성
  const createProduct = useCallback(async (productData) => {
    const response = await api.post('/products', {
      ...productData,
      price: Number(productData.price),
    })
    return response.data
  }, [])

  // 상품 수정
  const updateProduct = useCallback(async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, {
      ...productData,
      price: Number(productData.price),
    })
    return response.data
  }, [])

  // 상품 삭제
  const deleteProduct = useCallback(async (productId) => {
    await api.delete(`/products/${productId}`)
  }, [])

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}

export default useProducts
