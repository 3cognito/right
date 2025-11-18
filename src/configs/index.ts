import * as dotenv from "dotenv";

dotenv.config({
  path: "./src/.env",
});

export interface EnvConfig {
  CLAUDE_API_KEY: string;
  NODE_ENV: string;
  CLAUDE_BASE_URL: string;
  PORT: number;
  CLAUDE_TOKEN_COUNT_ENDPOINT: string;
}

export interface ConfigSchema {
  required?: { [key: string]: any };
  optional?: { [key: string]: any };
}

type Coercer = (value: string) => any;

const coercers: { [type: string]: Coercer } = {
  string: (v) => {
    if (v.trim()) return v;
    throw new Error(`Empty string not allowed`);
  },
  number: (v) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error(`Invalid number: ${v}`);
    return n;
  },
  boolean: (v) => {
    if (v === "true") return true;
    if (v === "false") return false;
    throw new Error(`Invalid boolean: ${v}`);
  },
};

export class ConfigLoader {
  private schema: ConfigSchema;

  constructor(schema: ConfigSchema) {
    this.schema = schema;
  }

  private parseValue(key: string, value: string, typeHint?: string): any {
    if (!typeHint) return value;
    const coercer = coercers[typeHint];
    if (!coercer) throw new Error(`Unknown type: ${typeHint} for ${key}`);
    return coercer(value);
  }

  load(): EnvConfig {
    const env = process.env;
    const required = this.schema.required || {};
    const optional = this.schema.optional || {};
    const loadedData: { [key: string]: any } = {};

    for (const key in required) {
      if (!(key in env)) {
        throw new Error(`Missing required env var: ${key}`);
      }
      const typeHint = required[key].type;
      loadedData[key] = this.parseValue(key, env[key]!, typeHint);
    }

    for (const key in optional) {
      if (key in env) {
        const typeHint = optional[key].type;
        loadedData[key] = this.parseValue(key, env[key]!, typeHint);
      } else if (optional[key].default !== undefined) {
        loadedData[key] = optional[key].default;
      }
    }

    return loadedData as EnvConfig;
  }
}

const schema: ConfigSchema = {
  required: {
    CLAUDE_API_KEY: { type: "string" },
    CLAUDE_TOKEN_COUNT_ENDPOINT: { type: "string" },
    CLAUDE_BASE_URL: { type: "string" },
  },
  optional: {
    NODE_ENV: { type: "string", default: "development" },
    PORT: { type: "number", default: 7766 },
  },
};

const loader = new ConfigLoader(schema);
export const config: EnvConfig = loader.load();

export default config;
