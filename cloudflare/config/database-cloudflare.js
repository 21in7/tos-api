// Cloudflare Workers용 데이터베이스 설정
// D1 데이터베이스 또는 외부 데이터베이스 연결

class CloudflareDBHelpers {
  constructor(env) {
    this.env = env;
    // D1 데이터베이스 사용 시
    this.db = env.DB; // D1 데이터베이스 바인딩
  }

  async readQuery(query, params = []) {
    try {
      // D1 데이터베이스 사용
      if (this.db) {
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results || [];
      }
      
      // 외부 데이터베이스 사용 (예: PlanetScale, Neon 등)
      // HTTP API를 통한 데이터베이스 연결
      const response = await fetch(`${this.env.DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.DB_API_KEY}`
        },
        body: JSON.stringify({
          query,
          params
        })
      });
      
      if (!response.ok) {
        throw new Error(`Database query failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Database read error:', error);
      throw error;
    }
  }

  async writeQuery(query, params = []) {
    try {
      // D1 데이터베이스 사용
      if (this.db) {
        const result = await this.db.prepare(query).bind(...params).run();
        return {
          insertId: result.meta.last_row_id,
          affectedRows: result.meta.changes
        };
      }
      
      // 외부 데이터베이스 사용
      const response = await fetch(`${this.env.DB_API_URL}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.DB_API_KEY}`
        },
        body: JSON.stringify({
          query,
          params
        })
      });
      
      if (!response.ok) {
        throw new Error(`Database write failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        insertId: data.insertId,
        affectedRows: data.affectedRows
      };
    } catch (error) {
      console.error('Database write error:', error);
      throw error;
    }
  }
}

// 환경별 데이터베이스 헬퍼 생성
export function createDBHelpers(env) {
  return new CloudflareDBHelpers(env);
}

export { CloudflareDBHelpers };
