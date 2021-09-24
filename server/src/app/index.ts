import { findPort } from '@/sip/find-port';
import * as express from 'express';
import { createServer } from 'http';
import { NetworkInterfaceInfo, networkInterfaces } from 'os';
import { reactRouter } from './react';

export const app = express();

export const server = createServer(app);

app.use(reactRouter);

// Find local ip
const hostAddress =
  (<(NetworkInterfaceInfo | undefined)[]>[])
    .concat(...Object.values(networkInterfaces()))
    .find((x) => x && !x.internal && x.family === 'IPv4')?.address ||
  'localhost';

// Find a port
let prefPort: number | null = null;

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
    server.listen(port, () =>
      console.log(`App started: http://${hostAddress}:${port}`)
    );
  });
}
