const mysql = require('mysql2/promise');

// 데이터베이스 설정 템플릿
const createDbConfig = (database) => ({
  host: process.env.DB_MASTER_HOST || '217.142.235.27',
  port: process.env.DB_MASTER_PORT || 3306,
  user: process.env.DB_MASTER_USER || 'gihyeon',
  password: process.env.DB_MASTER_PASSWORD || '1234',
  database: database,
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// 언어별 데이터베이스 설정
const dbConfigs = {
  ktos: {
    master: createDbConfig('ktos'),
    slave: createDbConfig('ktos')
  },
  itos: {
    master: createDbConfig('itos'),
    slave: createDbConfig('itos')
  },
  jtos: {
    master: createDbConfig('jtos'),
    slave: createDbConfig('jtos')
  }
};

// 기본 설정 (ktos)
const masterConfig = dbConfigs.ktos.master;
const slaveConfig = dbConfigs.ktos.slave;

// 언어별 연결 풀 생성
const dbPools = {};

// 각 언어별로 연결 풀 생성
Object.keys(dbConfigs).forEach(lang => {
  dbPools[lang] = {
    master: mysql.createPool({
      ...dbConfigs[lang].master,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }),
    slave: mysql.createPool({
      ...dbConfigs[lang].slave,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  };
});

// 기본 연결 풀 (ktos)
const masterPool = dbPools.ktos.master;
const slavePool = dbPools.ktos.slave;

// DB 연결 테스트
const testConnections = async () => {
  try {
    // 모든 언어별 DB 연결 테스트
    for (const lang of Object.keys(dbPools)) {
      const masterConnection = await dbPools[lang].master.getConnection();
      console.log(`✅ ${lang.toUpperCase()} 마스터 DB 연결 성공`);
      masterConnection.release();

      const slaveConnection = await dbPools[lang].slave.getConnection();
      console.log(`✅ ${lang.toUpperCase()} 슬레이브 DB 연결 성공`);
      slaveConnection.release();
    }
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

// 언어별 DB 쿼리 헬퍼 함수들
const createDbHelpers = (lang = 'ktos') => {
  const pools = dbPools[lang];
  
  return {
    // 읽기 전용 쿼리 (슬레이브 DB 사용)
    async readQuery(sql, params = []) {
      try {
        console.log(`[${lang.toUpperCase()}] 쿼리 실행:`, sql, params);
        const [rows] = await pools.slave.execute(sql, params);
        console.log(`[${lang.toUpperCase()}] 결과 개수:`, rows.length);
        return rows;
      } catch (error) {
        console.error(`${lang.toUpperCase()} 읽기 쿼리 오류:`, error);
        throw error;
      }
    },

    // 쓰기 전용 쿼리 (마스터 DB 사용)
    async writeQuery(sql, params = []) {
      try {
        const [result] = await pools.master.execute(sql, params);
        return result;
      } catch (error) {
        console.error(`${lang.toUpperCase()} 쓰기 쿼리 오류:`, error);
        throw error;
      }
    },

    // 트랜잭션 (마스터 DB 사용)
    async transaction(callback) {
      const connection = await pools.master.getConnection();
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
    }
  };
};

// 기본 DB 헬퍼 (ktos)
const dbHelpers = createDbHelpers('ktos');

// 언어별 DB 헬퍼 생성 함수
const getDbHelpers = (lang) => {
  if (!dbPools[lang]) {
    throw new Error(`지원하지 않는 언어: ${lang}`);
  }
  return createDbHelpers(lang);
};

// 연결 풀 종료
const closePools = async () => {
  for (const lang of Object.keys(dbPools)) {
    await dbPools[lang].master.end();
    await dbPools[lang].slave.end();
    console.log(`${lang.toUpperCase()} DB 연결 풀이 종료되었습니다.`);
  }
};

module.exports = {
  masterPool,
  slavePool,
  dbHelpers,
  getDbHelpers,
  dbPools,
  initializeDatabase,
  closePools
};
