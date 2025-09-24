#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class TosApiMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tos-api-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_jobs',
            description: '직업 목록을 조회합니다. 페이지네이션과 필터링을 지원합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호 (기본값: 1)' },
                limit: { type: 'number', description: '페이지당 항목 수 (기본값: 10)' },
                ids: { type: 'string', description: '직업 ID 필터 (쉼표로 구분)' },
                job_tree: { type: 'string', description: '직업 트리 필터' },
                is_starter: { type: 'number', description: '스타터 직업 여부 (0 또는 1)' },
                search: { type: 'string', description: '검색어' }
              }
            }
          },
          {
            name: 'get_job_by_id',
            description: 'ID로 특정 직업을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '직업 ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_job_by_name',
            description: '이름으로 직업을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '직업 이름' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_jobs_by_tree',
            description: '직업 트리별로 직업 목록을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                job_tree: { type: 'string', description: '직업 트리 이름' }
              },
              required: ['job_tree']
            }
          },
          {
            name: 'get_starter_jobs',
            description: '스타터 직업 목록을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_job_stats',
            description: '직업 통계를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_items',
            description: '아이템 목록을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호' },
                limit: { type: 'number', description: '페이지당 항목 수' },
                category: { type: 'string', description: '아이템 카테고리' },
                grade: { type: 'string', description: '아이템 등급' },
                search: { type: 'string', description: '검색어' }
              }
            }
          },
          {
            name: 'get_item_by_id',
            description: 'ID로 특정 아이템을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '아이템 ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_skills',
            description: '스킬 목록을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호' },
                limit: { type: 'number', description: '페이지당 항목 수' },
                job_id: { type: 'string', description: '직업 ID 필터' },
                skill_type: { type: 'string', description: '스킬 타입' },
                search: { type: 'string', description: '검색어' }
              }
            }
          },
          {
            name: 'get_skill_by_id',
            description: 'ID로 특정 스킬을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '스킬 ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_monsters',
            description: '몬스터 목록을 조회합니다. 페이지네이션과 필터링을 지원합니다. 기본적으로 유효한 데이터만 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호 (기본값: 1)' },
                limit: { type: 'number', description: '페이지당 항목 수 (기본값: 10)' },
                ids: { type: 'string', description: '몬스터 ID 필터' },
                level_min: { type: 'number', description: '최소 레벨' },
                level_max: { type: 'number', description: '최대 레벨' },
                race: { type: 'string', description: '종족 필터' },
                rank: { type: 'string', description: '등급 필터' },
                element: { type: 'string', description: '속성 필터' },
                search: { type: 'string', description: '검색어 (이름 또는 id_name)' },
                validOnly: { type: 'boolean', description: '유효한 데이터만 조회 (기본값: true)' }
              }
            }
          },
          {
            name: 'get_monster_by_id',
            description: 'ids로 특정 몬스터를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '몬스터 ids' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_monster_by_name',
            description: '이름으로 몬스터를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '몬스터 이름' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_monsters_by_level_range',
            description: '레벨 범위별 몬스터를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                min_level: { type: 'number', description: '최소 레벨' },
                max_level: { type: 'number', description: '최대 레벨' },
                page: { type: 'number', description: '페이지 번호' },
                limit: { type: 'number', description: '페이지당 항목 수' }
              },
              required: ['min_level', 'max_level']
            }
          },
          {
            name: 'get_monster_stats',
            description: '몬스터 통계를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_attributes',
            description: '속성 목록을 조회합니다. 페이지네이션과 필터링을 지원합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호 (기본값: 1)' },
                limit: { type: 'number', description: '페이지당 항목 수 (기본값: 10)' },
                ids: { type: 'string', description: '속성 ID 필터' },
                type: { type: 'string', description: '속성 타입' },
                search: { type: 'string', description: '검색어' }
              }
            }
          },
          {
            name: 'get_attribute_by_id',
            description: 'ids로 특정 속성을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: '속성 ids' }
              },
              required: ['id']
            }
          },
          {
            name: 'get_attribute_by_name',
            description: '이름으로 속성을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '속성 이름' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_attributes_by_type',
            description: '타입별 속성을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: '속성 타입' }
              },
              required: ['type']
            }
          },
          {
            name: 'get_maps',
            description: '맵 목록을 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: '페이지 번호' },
                limit: { type: 'number', description: '페이지당 항목 수' },
                region: { type: 'string', description: '지역 필터' },
                level_min: { type: 'number', description: '최소 레벨' },
                level_max: { type: 'number', description: '최대 레벨' },
                search: { type: 'string', description: '검색어' }
              }
            }
          },
          {
            name: 'get_dashboard_stats',
            description: '대시보드 통계를 조회합니다.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // 도구 호출 처리
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let response;
        
        switch (name) {
          case 'get_jobs':
            response = await this.makeApiCall('/api/jobs', 'GET', args);
            break;
          case 'get_job_by_id':
            response = await this.makeApiCall(`/api/jobs/${args.id}`, 'GET');
            break;
          case 'get_job_by_name':
            response = await this.makeApiCall(`/api/jobs/name/${encodeURIComponent(args.name)}`, 'GET');
            break;
          case 'get_jobs_by_tree':
            response = await this.makeApiCall(`/api/jobs/tree/${args.job_tree}`, 'GET');
            break;
          case 'get_starter_jobs':
            response = await this.makeApiCall('/api/jobs/starter/all', 'GET');
            break;
          case 'get_job_stats':
            response = await this.makeApiCall('/api/jobs/stats/overview', 'GET');
            break;
          case 'get_items':
            response = await this.makeApiCall('/api/items', 'GET', args);
            break;
          case 'get_item_by_id':
            response = await this.makeApiCall(`/api/items/${args.id}`, 'GET');
            break;
          case 'get_skills':
            response = await this.makeApiCall('/api/skills', 'GET', args);
            break;
          case 'get_skill_by_id':
            response = await this.makeApiCall(`/api/skills/${args.id}`, 'GET');
            break;
          case 'get_monsters':
            response = await this.makeApiCall('/api/monsters', 'GET', args);
            break;
          case 'get_monster_by_id':
            response = await this.makeApiCall(`/api/monsters/${args.id}`, 'GET');
            break;
          case 'get_monster_by_name':
            response = await this.makeApiCall(`/api/monsters/name/${encodeURIComponent(args.name)}`, 'GET');
            break;
          case 'get_monsters_by_level_range':
            response = await this.makeApiCall(`/api/monsters/level/${args.min_level}/${args.max_level}`, 'GET', args);
            break;
          case 'get_monster_stats':
            response = await this.makeApiCall('/api/monsters/stats', 'GET');
            break;
          case 'get_attributes':
            response = await this.makeApiCall('/api/attributes', 'GET', args);
            break;
          case 'get_attribute_by_id':
            response = await this.makeApiCall(`/api/attributes/${args.id}`, 'GET');
            break;
          case 'get_attribute_by_name':
            response = await this.makeApiCall(`/api/attributes/name/${encodeURIComponent(args.name)}`, 'GET');
            break;
          case 'get_attributes_by_type':
            response = await this.makeApiCall(`/api/attributes/type/${args.type}`, 'GET');
            break;
          case 'get_maps':
            response = await this.makeApiCall('/api/maps', 'GET', args);
            break;
          case 'get_dashboard_stats':
            response = await this.makeApiCall('/api/dashboard/stats', 'GET');
            break;
          default:
            throw new Error(`알 수 없는 도구: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류 발생: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async makeApiCall(endpoint, method = 'GET', params = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      method,
      url,
      timeout: 10000
    };

    if (method === 'GET' && Object.keys(params).length > 0) {
      config.params = params;
    }

    const response = await axios(config);
    return response;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TOS API MCP 서버가 시작되었습니다.');
  }
}

// 서버 실행
if (require.main === module) {
  const server = new TosApiMcpServer();
  server.run().catch(console.error);
}

module.exports = TosApiMcpServer;
