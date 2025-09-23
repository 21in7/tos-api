const https = require('https');

// 아이콘 URL 존재 여부 확인 (비동기)
async function checkIconExists(url) {
  return new Promise((resolve) => {
    const request = https.get(url, { method: 'HEAD' }, (response) => {
      resolve(response.statusCode === 200);
    });
    
    request.on('error', () => {
      resolve(false);
    });
    
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

// 아이콘 URL 생성 (존재 여부 확인 포함)
async function generateIconUrl(icon, folder = 'icons') {
  if (!icon) return null;
  
  const baseUrl = process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com';
  const iconUrl = `${baseUrl}/${folder}/${icon}.png`;
  
  try {
    const exists = await checkIconExists(iconUrl);
    return exists ? iconUrl : null;
  } catch (error) {
    console.warn(`아이콘 확인 실패: ${iconUrl}`, error.message);
    return null;
  }
}

// 배치 아이콘 URL 생성 (성능 최적화)
async function generateIconUrlsBatch(rows, folder = 'icons') {
  const baseUrl = process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com';
  
  // 중복 제거된 아이콘 목록 생성
  const uniqueIcons = [...new Set(rows.map(row => row.icon).filter(Boolean))];
  
  // 병렬로 아이콘 존재 여부 확인
  const iconExistsMap = {};
  const checkPromises = uniqueIcons.map(async (icon) => {
    const iconUrl = `${baseUrl}/${folder}/${icon}.png`;
    try {
      const exists = await checkIconExists(iconUrl);
      iconExistsMap[icon] = exists ? iconUrl : null;
    } catch (error) {
      console.warn(`아이콘 확인 실패: ${iconUrl}`, error.message);
      iconExistsMap[icon] = null;
    }
  });
  
  await Promise.all(checkPromises);
  
  // 결과 매핑
  return rows.map(row => ({
    ...row,
    icon_url: row.icon ? iconExistsMap[row.icon] : null
  }));
}

module.exports = {
  checkIconExists,
  generateIconUrl,
  generateIconUrlsBatch
};
