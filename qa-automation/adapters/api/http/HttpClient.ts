/**
 * API Adapter: Generic HTTP REST Client
 * Dành cho kiểm thử API độc lập hoặc kiểm thử xác thực trạng thái backend
 */

export interface ApiResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
  durationMs: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  async get<T = any>(endpoint: string, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  async post<T = any>(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, headers);
  }

  private async request<T>(method: string, endpoint: string, body?: any, customHeaders: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const start = Date.now();

    const response = await fetch(url, {
      method,
      headers: { ...this.defaultHeaders, ...customHeaders },
      body: body ? JSON.stringify(body) : undefined
    });

    const durationMs = Date.now() - start;
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    const headersRecord: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headersRecord[key] = val;
    });

    return {
      status: response.status,
      headers: headersRecord,
      data,
      durationMs
    };
  }
}
