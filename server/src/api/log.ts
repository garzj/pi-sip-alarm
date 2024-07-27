import { ProvideAPI } from '.';
import { logFilePath } from '../config/paths';
import { logger } from '../logger';

export const provideLogApi: ProvideAPI = (io) => {
  io.on('connection', (socket) => {
    socket.on(
      'log-get',
      (callback: (log: string, logFilePath: string) => void) => {
        if (typeof callback !== 'function') return;

        callback(logger.getLog(), logFilePath);
      }
    );

    function onLog(line: string) {
      socket.emit('log', line);
    }
    logger.on('log', onLog);
    socket.on('disconnect', () => logger.off('log', onLog));
  });
};
