const mysql = require('mysql2/promise');

// 마스터 DB 설정 (쓰기 전용)
const masterConfig = {
  host: process.env.DB_MASTER_HOST || '',
  port: process.env.DB_MASTER_PORT || 3306,
  user: process.env.DB_MASTER_USER || '',
  password: process.env.DB_MASTER_PASSWORD || '',
  database: process.env.DB_NAME || 'ktos',
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 슬레이브 DB 설정 (읽기 전용)
const slaveConfig = {
  host: process.env.DB_SLAVE_HOST || '',
  port: process.env.DB_SLAVE_PORT || 3306,
  user: process.env.DB_SLAVE_USER || '',
  password: process.env.DB_SLAVE_PASSWORD || '',
  database: process.env.DB_NAME || 'ktos',
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 연결 풀 생성
const masterPool = mysql.createPool({
  ...masterConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const slavePool = mysql.createPool({
  ...slaveConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// DB 연결 테스트
const testConnections = async () => {
  try {
    // 마스터 연결 테스트
    const masterConnection = await masterPool.getConnection();
    console.log('✅ 마스터 DB 연결 성공');
    masterConnection.release();

    // 슬레이브 연결 테스트
    const slaveConnection = await slavePool.getConnection();
    console.log('✅ 슬레이브 DB 연결 성공');
    slaveConnection.release();
  } catch (error) {
    console.error('❌ DB 연결 실패:', error.message);
    throw error;
  }
};

// 데이터베이스 초기화 (테이블이 이미 존재한다고 가정)
const initializeDatabase = async () => {
  try {
    await testConnections();
    console.log('데이터베이스 연결이 확인되었습니다.');
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    throw error;
  }
};

// DB 쿼리 헬퍼 함수들
const dbHelpers = {
  // 읽기 전용 쿼리 (슬레이브 DB 사용)
  async readQuery(sql, params = []) {
    try {
      const [rows] = await slavePool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('읽기 쿼리 오류:', error);
      throw error;
    }
  },

  // 쓰기 전용 쿼리 (마스터 DB 사용)
  async writeQuery(sql, params = []) {
    try {
      const [result] = await masterPool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('쓰기 쿼리 오류:', error);
      throw error;
    }
  },

  // 트랜잭션 (마스터 DB 사용)
  async transaction(callback) {
    const connection = await masterPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 연결 풀 종료
  async closePools() {
    await masterPool.end();
    await slavePool.end();
    console.log('DB 연결 풀이 종료되었습니다.');
  }
};

module.exports = {
  masterPool,
  slavePool,
  dbHelpers,
  initializeDatabase
};
