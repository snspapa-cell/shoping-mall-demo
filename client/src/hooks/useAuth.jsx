import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

// 인증 Context 생성
const AuthContext = createContext(null);

// 인증 Provider 컴포넌트
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기화 - 저장된 토큰으로 사용자 정보 복원
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (token && savedUser) {
        try {
          // 저장된 사용자 정보 복원
          setUser(JSON.parse(savedUser));
          
          // 서버에서 최신 사용자 정보 가져오기 (토큰 유효성 검증)
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data);
            // 최신 정보로 업데이트
            const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃
          console.error('인증 초기화 실패:', error);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
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

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1rem',
        color: '#666'
      }}>
        로딩 중...
      </div>
    );
  }

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

