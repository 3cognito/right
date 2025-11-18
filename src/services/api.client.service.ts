interface ApiResponse<T = any> {
  status: number;
  data: T;
  ok: boolean;
}

export class ApiClientService {
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers || {},
      });

      const data = await response.json();

      return {
        status: response.status,
        data,
        ok: response.ok,
      };
    } catch (error) {
      throw new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async post<T = any>(url: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        status: response.status,
        data,
        ok: response.ok,
      };
    } catch (error) {
      throw new Error(`POST request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const apiClient = new ApiClientService();

export default apiClient;
