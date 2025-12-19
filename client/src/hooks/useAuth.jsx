import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

// 인증 Context 생성
const AuthContext = createContext(null);

// 인증 Provider 컴포넌트
export function AuthProvider({ children }) {
  // localStorage에서 초기 사용자 정보 즉시 복원
  const getInitialUser = () => {
    try {
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('사용자 정보 파싱 실패:', e);
    }
    return null;
  };

  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false); // 초기값 false로 변경

  // 초기화 - 서버에서 토큰 유효성 검증 (백그라운드)
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (token && user) {
        try {
          // 서버에서 최신 사용자 정보 가져오기 (토큰 유효성 검증)
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const freshUser = response.data.data;
            setUser(freshUser);
            // 최신 정보로 업데이트
            const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃
          console.error('토큰 검증 실패:', error);
          // 서버 오류가 아닌 인증 오류일 경우에만 로그아웃
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            setUser(null);
          }
        }
      }
    };

    verifyAuth();
  }, []);

  // 로그인
  const login = async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const { user: userData, token } = response.data.data;
      
      // 토큰과 사용자 정보 저장
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      return { success: true, user: userData };
    }
    
    return { success: false, message: response.data.message };
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  // 사용자 정보 업데이트
  const updateUser = (userData) => {
    setUser(userData);
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth 훅
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
  }
  
  return context;
}

export default useAuth;

