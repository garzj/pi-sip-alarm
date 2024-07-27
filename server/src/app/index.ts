import express from 'express';
import { createServer } from 'http';
import { NetworkInterfaceInfo, networkInterfaces } from 'os';
import { reactRouter } from './react';
import { findPort } from '../sip/find-port';

export const app = express();

export const server = createServer(app);

app.use(reactRouter);

// Find local ip
const hostAddresses = (<(NetworkInterfaceInfo | undefined)[]>[])
  .concat(...Object.values(networkInterfaces()))
  .filter(
    (x): x is NetworkInterfaceInfo => !!x && !x.internal && x.family === 'IPv4'
  )
  .map((x) => x.address)
  .filter((addr) => addr !== '127.0.0.1');
hostAddresses.push('localhost');

// Find a port
let prefPort: number | null = null;

if (process.env.NODE_ENV === 'development') {
  prefPort = 5000;
}

if (
  process.env.PORT !== undefined &&
  Number.isInteger(parseInt(process.env.PORT))
) {
  prefPort = parseInt(process.env.PORT);

  if (prefPort < 0 || prefPort > 65535) {
    prefPort = null;
  }
}

if (prefPort === null) {
  console.error(
    `The specified port has to be an integer between 0 and 65535. Found: ${process.env.PORT}`
  );
} else {
  findPort(prefPort).then((port) => {
    // Start server
    server.listen(port, () => {
      console.log('App started:');
      for (const hostAddress of hostAddresses) {
        console.log(`http://${hostAddress}:${port}`);
      }
    });
  });
}
