# Shopping Mall Server

Node.js + Express + MongoDB 기반 쇼핑몰 백엔드 서버

## 📋 요구사항

- Node.js 18.x 이상
- MongoDB 6.x 이상 (로컬 또는 MongoDB Atlas)

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 `.env`로 복사하고 필요한 값을 설정하세요:

```bash
cp env.example .env
```

### 3. MongoDB 실행

로컬 MongoDB가 실행 중인지 확인하거나, MongoDB Atlas URI를 `.env`에 설정하세요.

### 4. 서버 실행

**개발 모드 (자동 재시작):**
```bash
npm run dev
```

**프로덕션 모드:**
```bash
npm start
```

## 📁 프로젝트 구조

```
server/
├── src/
│   ├── config/         # 설정 파일 (DB 연결 등)
│   ├── controllers/    # 비즈니스 로직
│   ├── middleware/     # 커스텀 미들웨어
│   ├── models/         # Mongoose 모델
│   ├── routes/         # API 라우트
│   └── index.js        # 앱 진입점
├── package.json
└── README.md
```

## 🔗 API 엔드포인트

| Method | Endpoint      | Description     |
|--------|---------------|-----------------|
| GET    | /             | 서버 상태 확인   |
| GET    | /api/health   | 헬스 체크       |

## 📝 라이센스

ISC




