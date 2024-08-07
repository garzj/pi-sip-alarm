import { env } from './config/env';
import './config/proc';
import './logger';
console.log(`Starting app in ${env.NODE_ENV} mode.`);

import { server } from './app';
import { setupApi } from './api';
setupApi(server);

import './sip/alarms';
