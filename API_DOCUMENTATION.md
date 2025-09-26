# Gihyeon of Soul API Documentation

## Overview
The Gihyeon of Soul API is a comprehensive REST API service that provides game data management for the Tree of Savior game. This API offers endpoints for managing jobs, items, monsters, skills, attributes, buffs, maps, and more.

## Language Support
This API supports multiple languages through different base URLs:
- **Korean Data**: Use `/ktos/api` prefix for Korean game data
- **English Data**: Use `/itos/api` prefix for English game data
- **Japanese Data**: Use `/jtos/api` prefix for Japanese game data
- **Default**: Use `/api` prefix (defaults to Korean data)

## Base URLs

### Korean Data (KTOS)
```
https://your-domain.com/ktos/api
```

### English Data (ITOS)
```
https://your-domain.com/itos/api
```

### Japanese Data (JTOS)
```
https://your-domain.com/jtos/api
```

### Default (Korean)
```
https://your-domain.com/api
```

## Authentication
Currently, this API does not require authentication for read operations. Write operations may require authentication in future versions.

## Rate Limiting
- **Production**: 100 requests per 15 minutes per IP
- **Development**: 1000 requests per 15 minutes per IP

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... }, // Only for paginated responses
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### 1. Jobs API

#### Get All Jobs
```http
# Korean data
GET /ktos/api/jobs
GET /api/jobs

# English data  
GET /itos/api/jobs
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `ids` (optional): Filter by job IDs (comma-separated)
- `job_tree` (optional): Filter by job tree
- `is_starter` (optional): Filter starter jobs (0 or 1)
- `search` (optional): Search term

**Examples:**
```http
# Korean data
GET /ktos/api/jobs?page=1&limit=20&job_tree=swordman&search=검사
GET /api/jobs?page=1&limit=20&job_tree=swordman&search=검사

# English data
GET /itos/api/jobs?page=1&limit=20&job_tree=swordman&search=warrior
```

#### Get Job by ID
```http
# Korean data
GET /ktos/api/jobs/{id}
GET /api/jobs/{id}

# English data
GET /itos/api/jobs/{id}
```

#### Get Job by Name
```http
# Korean data
GET /ktos/api/jobs/name/{name}
GET /api/jobs/name/{name}

# English data
GET /itos/api/jobs/name/{name}
```

#### Get Jobs by Tree
```http
# Korean data
GET /ktos/api/jobs/tree/{jobTree}
GET /api/jobs/tree/{jobTree}

# English data
GET /itos/api/jobs/tree/{jobTree}
```

#### Get Starter Jobs
```http
# Korean data
GET /ktos/api/jobs/starter/all
GET /api/jobs/starter/all

# English data
GET /itos/api/jobs/starter/all
```

#### Get Job Statistics
```http
# Korean data
GET /ktos/api/jobs/stats/overview
GET /api/jobs/stats/overview

# English data
GET /itos/api/jobs/stats/overview
```



**Request Body:**
```json
{
  "ids": "string",
  "id_name": "string",
  "name": "string",
  "job_tree": "string",
  "is_starter": 0,
  "description": "string",
  "icon": "string"
}
```

### 2. Items API

#### Get All Items
```http
# Korean data
GET /ktos/api/items
GET /api/items

# English data
GET /itos/api/items
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Item category filter
- `grade` (optional): Item grade filter
- `search` (optional): Search term

#### Get Item by ID
```http
GET /api/items/{id}
```

#### Get Item by Name
```http
GET /api/items/name/{name}
```

#### Search Items
```http
GET /api/items/search?q={search_term}
```

#### Get Items by Level Range
```http
GET /api/items/level/{minLevel}/{maxLevel}
```

#### Get Items by Type
```http
GET /api/items/type/{type}
```

#### Get Items by Rarity
```http
GET /api/items/rarity/{rarity}
```

#### Get Item Statistics
```http
GET /api/items/stats
```

#### Get Item Types
```http
GET /api/items/types
```

#### Get Item Rarities
```http
GET /api/items/rarities
```



### 3. Monsters API

#### Get All Monsters
```http
# Korean data
GET /ktos/api/monsters
GET /api/monsters

# English data
GET /itos/api/monsters
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `ids` (optional): Monster IDs filter
- `level_min` (optional): Minimum level
- `level_max` (optional): Maximum level
- `race` (optional): Race filter
- `rank` (optional): Rank filter
- `element` (optional): Element filter
- `search` (optional): Search term
- `validOnly` (optional): Valid data only (default: true)

#### Get Monster by ID
```http
GET /api/monsters/{id}
```

#### Get Monster by Name
```http
GET /api/monsters/name/{name}
```

#### Search Monsters
```http
GET /api/monsters/search?q={search_term}
```

#### Get Monsters by Level Range
```http
GET /api/monsters/level/{minLevel}/{maxLevel}
```

#### Get Monster Statistics
```http
GET /api/monsters/stats
```

### 4. Skills API

#### Get All Skills
```http
# Korean data
GET /ktos/api/skills
GET /api/skills

# English data
GET /itos/api/skills
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `job_id` (optional): Job ID filter
- `skill_type` (optional): Skill type filter
- `search` (optional): Search term

#### Get Skill by ID
```http
GET /api/skills/{id}
```

#### Get Skill by Name
```http
GET /api/skills/name/{name}
```

#### Search Skills
```http
GET /api/skills/search?q={search_term}
```

#### Get Skills by Type
```http
GET /api/skills/type/{type}
```

#### Get Skill Statistics
```http
GET /api/skills/stats
```

#### Get Skill Types
```http
GET /api/skills/types
```

### 5. Attributes API

#### Get All Attributes
```http
# Korean data
GET /ktos/api/attributes
GET /api/attributes

# English data
GET /itos/api/attributes
```

#### Get Attribute by ID
```http
GET /api/attributes/{id}
```

#### Get Attribute by Name
```http
GET /api/attributes/name/{name}
```

#### Get Attributes by Type
```http
GET /api/attributes/type/{type}
```

#### Get Attribute Statistics
```http
GET /api/attributes/stats
```

### 6. Buffs API

#### Get All Buffs
```http
# Korean data
GET /ktos/api/buffs
GET /api/buffs

# English data
GET /itos/api/buffs
```

#### Get Buff by ID
```http
GET /api/buffs/{id}
```

#### Get Buff by Name
```http
GET /api/buffs/name/{name}
```

#### Get Buffs by Type
```http
GET /api/buffs/type/{type}
```

#### Get Buff Statistics
```http
GET /api/buffs/stats
```

### 7. Maps API

#### Get All Maps
```http
# Korean data
GET /ktos/api/maps
GET /api/maps

# English data
GET /itos/api/maps
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `region` (optional): Region filter
- `level_min` (optional): Minimum level
- `level_max` (optional): Maximum level
- `search` (optional): Search term

### 8. Dashboard API

#### Get Dashboard Statistics
```http
# Korean data
GET /ktos/api/dashboard/stats
GET /api/dashboard/stats

# English data
GET /itos/api/dashboard/stats
```

#### Get Recent Data
```http
GET /api/dashboard/recent
```

#### Get System Status
```http
GET /api/dashboard/status
```

#### Get Table Information
```http
GET /api/dashboard/tables
```


## Pagination

For endpoints that support pagination, the response includes a `pagination` object:

```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "items_per_page": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Examples

### Get All Jobs with Pagination
```bash
# Korean data
curl -X GET "https://your-domain.com/ktos/api/jobs?page=1&limit=10"
curl -X GET "https://your-domain.com/api/jobs?page=1&limit=10"

# English data
curl -X GET "https://your-domain.com/itos/api/jobs?page=1&limit=10"
```

### Search for Items
```bash
# Korean data
curl -X GET "https://your-domain.com/ktos/api/items/search?q=검"
curl -X GET "https://your-domain.com/api/items/search?q=검"

# English data
curl -X GET "https://your-domain.com/itos/api/items/search?q=sword"
```

### Get Monster by Name
```bash
# Korean data
curl -X GET "https://your-domain.com/ktos/api/monsters/name/고블린"
curl -X GET "https://your-domain.com/api/monsters/name/고블린"

# English data
curl -X GET "https://your-domain.com/itos/api/monsters/name/Goblin"
```

### Get Skills by Job
```bash
# Korean data
curl -X GET "https://your-domain.com/ktos/api/skills?job_id=123"
curl -X GET "https://your-domain.com/api/skills?job_id=123"

# English data
curl -X GET "https://your-domain.com/itos/api/skills?job_id=123"
```

## Data Models

### Job Object
```json
{
  "id": 1,
  "ids": "swordman_1",
  "id_name": "Swordman",
  "name": "소드맨", // Korean name from KTOS DB
  "job_tree": "swordman",
  "is_starter": 1,
  "description": "Basic sword-wielding class",
  "icon": "swordman_icon.png",
  "icon_url": "https://cdn.example.com/icons/swordman_icon.png"
}
```

**Note**: The `name` field will contain Korean text when using `/ktos/api` or `/api` endpoints, and English text when using `/itos/api` endpoints.

### Item Object
```json
{
  "id": 1,
  "name": "철검", // Korean name from KTOS DB
  "category": "weapon",
  "grade": "common",
  "level": 5,
  "description": "A basic iron sword",
  "icon": "iron_sword.png",
  "icon_url": "https://cdn.example.com/icons/iron_sword.png"
}
```

**Note**: The `name` field will contain Korean text when using `/ktos/api` or `/api` endpoints, and English text when using `/itos/api` endpoints.

### Monster Object
```json
{
  "id": 1,
  "ids": "goblin_1",
  "name": "고블린", // Korean name from KTOS DB
  "level": 3,
  "race": "humanoid",
  "rank": "normal",
  "element": "neutral",
  "hp": 100,
  "attack": 15,
  "defense": 5
}
```

**Note**: The `name` field will contain Korean text when using `/ktos/api` or `/api` endpoints, and English text when using `/itos/api` endpoints.

## Support

For API support and questions, please contact the development team or refer to the project repository.

## Version
Current API Version: 1.0.0
