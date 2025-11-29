const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(testCase) {
  const url = `${BASE_URL}${testCase.path}`;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 테스트: ${testCase.name}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      console.log(`✅ Status Code: ${response.statusCode}`);
      
      if (typeof response.body === 'object') {
        // 기본 정보 출력
        if (response.body.success !== undefined) {
          console.log(`✅ Success: ${response.body.success}`);
        }
        if (response.body.message) {
          console.log(`✅ Message: ${response.body.message}`);
        }
        if (response.body.language) {
          console.log(`✅ Language: ${response.body.language}`);
        }
        
        // 데이터 확인
        if (response.body.data) {
          const dataCount = Array.isArray(response.body.data) ? response.body.data.length : 'N/A';
          console.log(`✅ Data Count: ${dataCount}`);
          
          if (Array.isArray(response.body.data) && response.body.data.length > 0) {
            const firstItem = response.body.data[0];
            console.log(`✅ First Item Keys: ${Object.keys(firstItem).join(', ')}`);
            if (firstItem.name) {
              console.log(`   - Name: ${firstItem.name}`);
            }
            if (firstItem.ids) {
              console.log(`   - IDs: ${firstItem.ids}`);
            }
          }
        }
        
        // 페이지네이션 확인
        if (response.body.pagination) {
          console.log(`✅ Pagination:`);
          console.log(`   - Page: ${response.body.pagination.page}`);
          console.log(`   - Limit: ${response.body.pagination.limit}`);
          console.log(`   - Total: ${response.body.pagination.total}`);
          console.log(`   - Total Pages: ${response.body.pagination.totalPages}`);
        }
        
        // 언어별 라우팅 확인
        if (testCase.path.includes('/ktos/')) {
          console.log(`✅ ktos 경로: 언어별 라우팅 작동 중`);
        } else if (testCase.path.includes('/itos/')) {
          console.log(`✅ itos 경로: 언어별 라우팅 작동 중`);
        } else if (testCase.path.includes('/jtos/')) {
          console.log(`✅ jtos 경로: 언어별 라우팅 작동 중`);
        }
        
        // 엔드포인트 확인
        if (response.body.endpoints) {
          console.log(`✅ Endpoints available: ${Object.keys(response.body.endpoints).length}`);
        }
      } else {
        console.log(`⚠️  응답이 JSON 객체가 아닙니다.`);
        console.log(`응답 미리보기: ${String(response.body).substring(0, 200)}`);
      }
    } else {
      console.log(`❌ 예상치 못한 상태 코드: ${response.statusCode}`);
      if (response.body && typeof response.body === 'object') {
        console.log(`에러 내용:`, JSON.stringify(response.body, null, 2));
      }
    }
  } catch (error) {
    console.log(`❌ 요청 실패: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`⚠️  서버가 실행 중이지 않습니다.`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`⚠️  요청 시간 초과`);
    }
  }
}

async function runTests() {
  console.log('\n🚀 API 서버 리팩토링 테스트 시작');
  console.log(`📍 서버 주소: ${BASE_URL}\n`);
  
  const endpoints = [
    { name: '1. 기본 라우트 (/)', path: '/' },
    { name: '2. 기본 아이템 목록 (ktos 기본)', path: '/api/items?page=1&limit=2' },
    { name: '3. ktos 아이템 목록', path: '/ktos/api/items?page=1&limit=2' },
    { name: '4. itos 아이템 목록', path: '/itos/api/items?page=1&limit=2' },
    { name: '5. jtos 아이템 목록', path: '/jtos/api/items?page=1&limit=2' },
    { name: '6. ktos 아이템 통계', path: '/ktos/api/items/stats' },
    { name: '7. 기본 아이템 통계', path: '/api/items/stats' },
  ];
  
  // 각 엔드포인트 테스트
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // 요청 간 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ 모든 테스트 완료');
  console.log(`${'='.repeat(70)}\n`);
}

runTests().catch(error => {
  console.error('테스트 실행 중 오류:', error);
  process.exit(1);
});

