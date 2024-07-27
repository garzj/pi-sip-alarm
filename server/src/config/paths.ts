import { F_OK } from 'constants';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { access } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

export const exists = (file: string) =>
  access(file, F_OK)
    .then(() => true)
    .catch(() => false);

function ensureDirSync(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export const rootDir =
  process.env.NODE_ENV === 'production'
    ? process.cwd()
    : join(dirname(fileURLToPath(import.meta.url)), '../../..');

export const pjcallBinPath = join(rootDir, 'pjcall/pjcall');

export const dataPath = join(rootDir, 'server/data');
ensureDirSync(dataPath);

export const audioPath = join(dataPath, 'audio');
ensureDirSync(audioPath);

export const tmpPath = join(dataPath, 'tmp');
rmSync(tmpPath, { recursive: true, force: true });
ensureDirSync(tmpPath);

export const configFilePath = join(dataPath, 'config.json');

export const logFilePath = join(dataPath, 'log.txt');

export const reactBuildPath = join(rootDir, 'client/build');
export const reactIndexPath = join(reactBuildPath, 'index.html');
