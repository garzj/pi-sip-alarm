import * as dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
    }
  }
}

process.env.NODE_ENV ??= 'production';
process.env.PORT ??= '5000';

export {};
