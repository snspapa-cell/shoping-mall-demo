const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGODB_ATLAS_URL을 우선 사용, 없으면 MONGODB_URI, 둘 다 없으면 로컬 주소 사용
    const mongoURI = process.env.MONGODB_ATLAS_URL || 
                     process.env.MONGODB_URI || 
                     'mongodb://localhost:27017/shopping-mall';
    
    const isAtlas = mongoURI.includes('mongodb+srv') || mongoURI.includes('mongodb.net');
    
    const conn = await mongoose.connect(mongoURI);
    
    if (isAtlas) {
      console.log(`✅ MongoDB Atlas 연결 성공: ${conn.connection.host}`);
    } else {
      console.log(`✅ MongoDB 로컬 연결 성공: ${conn.connection.host}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB 연결 실패: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

