const http = require('http');

async function test(url, name) {
  return new Promise((resolve) => {
    console.log(`\n[테스트] ${name}`);
    console.log(`URL: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          if (json.success !== undefined) console.log(`✅ Success: ${json.success}`);
          if (json.message) console.log(`✅ Message: ${json.message}`);
          if (json.language) console.log(`✅ Language: ${json.language}`);
          if (json.data && Array.isArray(json.data)) {
            console.log(`✅ Data Count: ${json.data.length}`);
          }
          if (json.pagination) {
            console.log(`✅ Pagination: page=${json.pagination.page}, total=${json.pagination.total}`);
          }
          resolve({ success: true, status: res.statusCode });
        } catch (e) {
          console.log(`⚠️  JSON 파싱 실패: ${e.message}`);
          console.log(`응답: ${data.substring(0, 100)}...`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (e) => {
      console.log(`❌ 에러: ${e.message}`);
      resolve({ success: false, error: e.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ 타임아웃`);
      resolve({ success: false, error: 'timeout' });
    });
  });
}

async function run() {
  console.log('='.repeat(60));
  console.log('API 서버 테스트 시작');
  console.log('='.repeat(60));
  
  const tests = [
    ['http://localhost:3000/', '1. 기본 라우트'],
    ['http://localhost:3000/api/items?page=1&limit=2', '2. 기본 아이템 (ktos)'],
    ['http://localhost:3000/ktos/api/items?page=1&limit=2', '3. ktos 아이템'],
    ['http://localhost:3000/itos/api/items?page=1&limit=2', '4. itos 아이템'],
    ['http://localhost:3000/jtos/api/items?page=1&limit=2', '5. jtos 아이템'],
    ['http://localhost:3000/ktos/api/items/stats', '6. ktos 아이템 통계'],
    ['http://localhost:3000/api/items/stats', '7. 기본 아이템 통계'],
  ];
  
  const results = [];
  for (const [url, name] of tests) {
    const result = await test(url, name);
    results.push(result);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('테스트 요약');
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  console.log(`성공: ${successCount}/${results.length}`);
  console.log('='.repeat(60));
}

run().catch(console.error);

