const { body, query, param } = require('express-validator');

// 공통 검증 규칙
const commonValidators = {
  // ID 검증
  id: param('id').isInt({ min: 1 }).withMessage('ID는 양의 정수여야 합니다.'),
  
  // 페이지네이션 검증
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('페이지 크기는 1-100 사이여야 합니다.')
  ],
  
  // 이름 검증
  name: body('name')
    .notEmpty()
    .withMessage('이름은 필수입니다.')
    .isLength({ min: 1, max: 100 })
    .withMessage('이름은 1-100자 사이여야 합니다.'),
  
  // 설명 검증
  description: body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('설명은 500자 이하여야 합니다.'),
  
  // 타입 검증
  type: body('type')
    .notEmpty()
    .withMessage('타입은 필수입니다.')
    .isIn(['weapon', 'armor', 'accessory', 'consumable', 'material'])
    .withMessage('유효하지 않은 타입입니다.')
};

// Attributes 검증 규칙
const attributeValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('속성 타입은 필수입니다.')
      .isIn(['strength', 'agility', 'intelligence', 'vitality', 'luck'])
      .withMessage('유효하지 않은 속성 타입입니다.'),
    body('base_value')
      .optional()
      .isInt({ min: 0 })
      .withMessage('기본값은 0 이상이어야 합니다.'),
    body('max_value')
      .optional()
      .isInt({ min: 1 })
      .withMessage('최대값은 1 이상이어야 합니다.')
  ],
  
  update: [
    commonValidators.id,
    ...commonValidators.pagination
  ]
};

// Buffs 검증 규칙
const buffValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('버프 타입은 필수입니다.')
      .isIn(['buff', 'debuff', 'neutral'])
      .withMessage('유효하지 않은 버프 타입입니다.'),
    body('duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('지속시간은 0 이상이어야 합니다.'),
    body('value')
      .optional()
      .isInt()
      .withMessage('값은 정수여야 합니다.'),
    body('stackable')
      .optional()
      .isBoolean()
      .withMessage('스택 가능 여부는 불린 값이어야 합니다.')
  ]
};

// Items 검증 규칙
const itemValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    commonValidators.type,
    body('rarity')
      .optional()
      .isIn(['common', 'uncommon', 'rare', 'epic', 'legendary'])
      .withMessage('유효하지 않은 희귀도입니다.'),
    body('level')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('레벨은 1-100 사이여야 합니다.'),
    body('price')
      .optional()
      .isInt({ min: 0 })
      .withMessage('가격은 0 이상이어야 합니다.'),
    body('stackable')
      .optional()
      .isBoolean()
      .withMessage('스택 가능 여부는 불린 값이어야 합니다.')
  ]
};

// Monsters 검증 규칙
const monsterValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('level')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('레벨은 1-100 사이여야 합니다.'),
    body('hp')
      .optional()
      .isInt({ min: 1 })
      .withMessage('HP는 1 이상이어야 합니다.'),
    body('attack')
      .optional()
      .isInt({ min: 0 })
      .withMessage('공격력은 0 이상이어야 합니다.'),
    body('defense')
      .optional()
      .isInt({ min: 0 })
      .withMessage('방어력은 0 이상이어야 합니다.'),
    body('speed')
      .optional()
      .isInt({ min: 1 })
      .withMessage('속도는 1 이상이어야 합니다.'),
    body('exp_reward')
      .optional()
      .isInt({ min: 0 })
      .withMessage('경험치 보상은 0 이상이어야 합니다.')
  ]
};

// Skills 검증 규칙
const skillValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('스킬 타입은 필수입니다.')
      .isIn(['active', 'passive', 'ultimate'])
      .withMessage('유효하지 않은 스킬 타입입니다.'),
    body('level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('스킬 레벨은 1-10 사이여야 합니다.'),
    body('cooldown')
      .optional()
      .isInt({ min: 0 })
      .withMessage('쿨다운은 0 이상이어야 합니다.'),
    body('mana_cost')
      .optional()
      .isInt({ min: 0 })
      .withMessage('마나 비용은 0 이상이어야 합니다.'),
    body('damage')
      .optional()
      .isInt({ min: 0 })
      .withMessage('데미지는 0 이상이어야 합니다.')
  ]
};

// Jobs 검증 규칙
const jobValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('직업 타입은 필수입니다.')
      .isIn(['warrior', 'mage', 'archer', 'rogue', 'cleric'])
      .withMessage('유효하지 않은 직업 타입입니다.')
  ]
};

// Maps 검증 규칙
const mapValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('맵 타입은 필수입니다.')
      .isIn(['dungeon', 'field', 'raid', 'pvp'])
      .withMessage('유효하지 않은 맵 타입입니다.')
  ]
};

// Market 검증 규칙
const marketValidators = {
  create: [
    body('item_id')
      .isInt({ min: 1 })
      .withMessage('아이템 ID는 필수입니다.'),
    body('price')
      .isInt({ min: 1 })
      .withMessage('가격은 1 이상이어야 합니다.'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('수량은 1 이상이어야 합니다.')
  ]
};

// Challenges 검증 규칙
const challengeValidators = {
  create: [
    commonValidators.name,
    commonValidators.description,
    body('type')
      .notEmpty()
      .withMessage('챌린지 타입은 필수입니다.')
      .isIn(['daily', 'weekly', 'monthly', 'special'])
      .withMessage('유효하지 않은 챌린지 타입입니다.'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'normal', 'hard', 'expert'])
      .withMessage('유효하지 않은 난이도입니다.')
  ]
};

// Planner 검증 규칙
const plannerValidators = {
  create: [
    commonValidators.name,
    body('data')
      .notEmpty()
      .withMessage('플래너 데이터는 필수입니다.'),
    body('type')
      .notEmpty()
      .withMessage('플래너 타입은 필수입니다.')
      .isIn(['character', 'build', 'quest', 'equipment'])
      .withMessage('유효하지 않은 플래너 타입입니다.')
  ]
};

module.exports = {
  commonValidators,
  attributeValidators,
  buffValidators,
  itemValidators,
  monsterValidators,
  skillValidators,
  jobValidators,
  mapValidators,
  marketValidators,
  challengeValidators,
  plannerValidators
};
