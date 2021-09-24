import * as Http from 'http';
import * as SocketIO from 'socket.io';
import { provideSipApi } from './sip';
import { provideLogApi } from './log';
import { provideAlarmsApi } from './alarms';

export type ProvideAPI = (io: SocketIO.Server) => void;

export function setupApi(server: Http.Server) {
  const io = new SocketIO.Server(server, {
    path: '/api',
    serveClient: false,
  });

  provideSipApi(io);
  provideAlarmsApi(io);
  provideLogApi(io);
}
