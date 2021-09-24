import { useEffect } from 'react';
import socketIOClient from 'socket.io-client';

const socket = socketIOClient(`ws://${window.location.host}`, {
  path: '/api',
  transports: ['websocket'],
  closeOnBeforeunload: false,
});

export const useSocketOn = (event: string, handler: (...args: any[]) => void) =>
  useEffect(() => {
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);

export const useSocketLoader = (loader: () => void) => {
  useEffect(() => {
    loader();
  }, [loader]);

  useSocketOn('connect', () => {
    loader();
  });
};

export const socketEmit = (event: string, ...args: any[]) =>
  socket.emit(event, ...args);
