import apiClient, { ApiClientService } from "./api.client.service";
import config from "../configs";

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T = any> {
  status: number;
  data: T;
  ok: boolean;
}

export interface ClaudeRequestDto {
  model?: string;
  input?: string;
  max_tokens_to_sample?: number;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  // allow provider-specific/custom fields
  [key: string]: any;
}

export class ClaudeService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly tokenCountEndpoint: string;
  private readonly apiClient: ApiClientService;

  constructor(opts: { baseUrl: string; apiKey: string; tokenCountEndpoint: string; apiClient: ApiClientService }) {
    this.baseUrl = opts.baseUrl;
    this.apiKey = opts.apiKey;
    this.apiClient = opts.apiClient || apiClient;
    this.tokenCountEndpoint = opts.tokenCountEndpoint;
  }

  defaults(dto?: Partial<ClaudeRequestDto>): ClaudeRequestDto {
    const base: ClaudeRequestDto = {
      model: "claude-2.1",
      input: "",
      max_tokens_to_sample: 1024,
      temperature: 0,
      top_p: 1,
      stop_sequences: [],
    };

    return { ...base, ...(dto || {}) };
  }

  async request<T = any>(dto: ClaudeRequestDto, options?: RequestOptions): Promise<ApiResponse<T>> {
    const merged = this.defaults(dto);

    const endpoint = `${this.baseUrl}/v1/complete`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await this.apiClient.post<T>(endpoint, merged, headers);
      return {
        status: res.status,
        data: res.data as T,
        ok: res.ok,
      };
    } catch (err) {
      throw new Error(`Claude request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async countTokens(text: string): Promise<number> {
    if (this.tokenCountEndpoint) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

        const res = await this.apiClient.post<{ token_count?: number }>(this.tokenCountEndpoint, { text }, headers);

        if (res && res.data && typeof res.data.token_count === "number") return res.data.token_count;
      } catch (_) {
        return this.fallBackTokenEstimator(text);
      }
    }

    return this.fallBackTokenEstimator(text);
  }

  private fallBackTokenEstimator(text: string) {
    //assuming 0.75 words per token
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return Math.max(0, Math.ceil(words * 1.3));
  }
}

export const claudeService = new ClaudeService({
  baseUrl: config.CLAUDE_BASE_URL,
  apiKey: config.CLAUDE_API_KEY,
  tokenCountEndpoint: config.CLAUDE_TOKEN_COUNT_ENDPOINT,
  apiClient: apiClient,
});

export default claudeService;
