import { createWriteStream, WriteStream } from 'fs';
import { TypedEmitter } from 'tiny-typed-emitter';
import { logFilePath } from './config/paths';

interface Events {
  log: (line: string) => void;
}

class Logger extends TypedEmitter<Events> {
  static MAX_LINES = 500;
  private stream: WriteStream | null = null;
  lines: string[] = [];

  constructor(logFilePath: string) {
    super();

    if (process.env.NODE_ENV === 'production') {
      // Log file in prod
      this.stream = createWriteStream(logFilePath);
    }

    // Redirect console
    const stdout = process.stdout;
    const stdoutWrite = stdout.write.bind(stdout);
    stdout.write = (buf: string | Uint8Array, a0?: any, a1?: any): boolean => {
      const data: string = buf.toString();
      this.log(data, 'LOG');
      if (!stdout.writable) return false;
      return stdoutWrite(buf, a0, a1);
    };
    const stderr = process.stderr;
    const stderrWrite = stderr.write.bind(stderr);
    stderr.write = (buf: string | Uint8Array, a0?: any, a1?: any): boolean => {
      const data: string = buf.toString();
      this.log(data, 'ERR');
      if (!stderr.writable) return false;
      return stderrWrite(buf, a0, a1);
    };
    process.on('uncaughtException', (e) => {
      const data = `${e?.stack ? e.stack : e}`;
      this.log(data, 'ERR');
    });
  }

  private log(data: string, prefix: string) {
    const lines = data.replace(/(\r|\n|\r\n)$/, '').split(/\r|\n|\r\n/);
    lines.forEach((raw) => {
      const line = `[${new Date().toUTCString()}] [${prefix}] ${raw}\n`;

      if (this.stream) {
        this.stream.write(line);
      }

      this.lines.push(line);
      if (this.lines.length > Logger.MAX_LINES) {
        this.lines.shift();
      }

      this.emit('log', line);
    });
  }

  getLog() {
    return this.lines.join('');
  }
}

export const logger = new Logger(logFilePath);
