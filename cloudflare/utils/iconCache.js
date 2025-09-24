// Cloudflare Workers용 아이콘 캐시 유틸리티

export function generateIconUrl(icon, type = 'icons', defaultIcon = 'default') {
  if (!icon) {
    return `https://r2.gihyeonofsoul.com/${type}/${defaultIcon}.png`;
  }
  
  // 아이콘 확장자 처리
  let iconName = icon;
  if (!iconName.includes('.')) {
    iconName += '.png';
  }
  
  return `https://r2.gihyeonofsoul.com/${type}/${iconName}`;
}

export function getDefaultIcon(type = 'icons') {
  const defaultIcons = {
    'icons': 'default-icon',
    'monster': 'default-monster',
    'item': 'default-item',
    'skill': 'default-skill',
    'attribute': 'default-attribute',
    'buff': 'default-buff'
  };
  
  return defaultIcons[type] || 'default-icon';
}
