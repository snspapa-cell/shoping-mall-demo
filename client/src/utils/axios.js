import axios from 'axios';

// API 기본 URL 설정
// 개발환경: Vite 프록시 사용 (/api)
// 배포환경: 환경변수에서 서버 URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 디버깅: 환경변수 확인 (배포 후 콘솔에서 확인)
console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[API Config] Using API_BASE_URL:', API_BASE_URL);

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 모든 요청에 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    // localStorage 또는 sessionStorage에서 토큰 가져오기
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 인증 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 (인증 실패) 처리
    if (error.response?.status === 401) {
      // 토큰 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인이 아닐 경우)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;






