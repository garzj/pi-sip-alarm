interface Env extends NodeJS.ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
}

const env = process.env as Env;

env.NODE_ENV ??= 'production';
env.PORT ??= '5000';

export { env };
