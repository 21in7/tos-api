// 아이콘 존재 여부를 캐싱하는 간단한 유틸리티
const iconCache = new Map();

// 알려진 존재하지 않는 아이콘 목록 (404 에러가 발생한 것들)
const knownMissingIcons = new Set([
  'collect-318',
  'collect-317', 
  'collect-316',
  'collect-260',
  'collect-402',
  'collect-324',
  'collect-431',
  '검은-계시의-장:-가디스-1회-입장권(거래불가)',
  '타락한-고대-정령:-가디스-1회-입장권',
  '무너지는-광산:-가디스-1회-입장권(거래불가)',
  // 아이템 아이콘들
  'item_boss_crystalgolem_party_enter',
  'item_boss_darkneringa_party_enter', 
  'item_boss_redania_party_enter'
]);

// 아이콘 URL 생성 (캐시 기반)
function generateIconUrl(icon, folder = 'icons', defaultIcon = 'default-item') {
  if (!icon) {
    return `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${defaultIcon}.png`;
  }

  // 알려진 존재하지 않는 아이콘인 경우 기본 아이콘 사용
  if (knownMissingIcons.has(icon)) {
    return `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${defaultIcon}.png`;
  }

  // 캐시에서 확인
  if (iconCache.has(icon)) {
    const exists = iconCache.get(icon);
    return exists ? 
      `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/${folder}/${icon}.png` :
      `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/icons/${defaultIcon}.png`;
  }

  // 기본적으로 아이콘이 있다고 가정 (성능상 이유로)
  return `${process.env.R2_BASE_URL || 'https://r2.gihyeonofsoul.com'}/${folder}/${icon}.png`;
}

// 아이콘 존재 여부를 캐시에 저장
function cacheIconStatus(icon, exists) {
  iconCache.set(icon, exists);
}

// 배치 아이콘 URL 생성
function generateIconUrlsBatch(rows, folder = 'icons', defaultIcon = 'default-item') {
  return rows.map(row => ({
    ...row,
    icon_url: generateIconUrl(row.icon, folder, defaultIcon)
  }));
}

module.exports = {
  generateIconUrl,
  cacheIconStatus,
  generateIconUrlsBatch,
  knownMissingIcons
};
