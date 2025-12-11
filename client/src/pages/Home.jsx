import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Home.css'

function Home() {
  const [serverStatus, setServerStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await axios.get('/api/health')
        setServerStatus(response.data)
      } catch (error) {
        setServerStatus({ status: 'ERROR', message: '서버 연결 실패' })
      } finally {
        setLoading(false)
      }
    }
    checkServer()
  }, [])

  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1>성찬 쇼핑몰</h1>
          <p>최고의 쇼핑 경험을 만나보세요</p>
        </header>

        <div className="home-actions">
          <Link to="/register" className="btn btn-primary">
            회원가입
          </Link>
          <button className="btn btn-secondary">로그인</button>
        </div>

        <div className="home-status">
          <div className="status-card">
            <h3>서버 상태</h3>
            {loading ? (
              <p className="status-loading">연결 확인 중...</p>
            ) : (
              <div className={`status-badge ${serverStatus?.status === 'OK' ? 'ok' : 'error'}`}>
                <span className="status-dot"></span>
                <span>{serverStatus?.status === 'OK' ? '서버 연결됨' : serverStatus?.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
