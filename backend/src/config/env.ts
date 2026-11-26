import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

const requiredVars: readonly string[] = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

for (const key of requiredVars) {
  if (!process.env[key] && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: SignOptions['expiresIn'];
}

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  clientUrl: string;
  db: DatabaseConfig;
  jwt: JwtConfig;
  logLevel: string;
}

const config: Readonly<EnvConfig> = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  db: Object.freeze({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'noted_db',
    connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || 'test-only-fallback-secret-key-12345',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  }),
  logLevel: process.env.LOG_LEVEL || 'info',
});

export default config;
