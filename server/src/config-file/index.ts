import { configFilePath, exists } from '../config/paths';
import { readFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { TypedEmitter } from 'tiny-typed-emitter';
import { defaultConfig } from './default';
import { configSchema, ConfigData } from '@shared/schema/config-file';
import { ZodError } from 'zod';
import { watch } from 'chokidar';

interface Events {
  change: () => void;
}

class ConfigFile extends TypedEmitter<Events> implements ConfigData {
  sip = defaultConfig.sip;
  alarms = defaultConfig.alarms;
  invalid = false;

  constructor(public readonly file: string) {
    super();

    this.init();
  }

  async writeToFile(configData: ConfigData) {
    await writeFile(this.file, JSON.stringify(configData, null, 2) + '\n');
  }

  private async init() {
    if (!(await exists(this.file))) {
      // Write default config to file
      const configData: ConfigData = {
        sip: this.sip,
        alarms: this.alarms,
      };
      await this.writeToFile(configData);
    } else {
      this.updateFromFile(true);
    }

    watch(this.file).on('change', () => this.updateFromFile());
  }

  getData(): ConfigData {
    return {
      sip: this.sip,
      alarms: this.alarms,
    };
  }

  async updateFromFile(sync?: boolean) {
    const rawData = (
      sync ? readFileSync(this.file) : await readFile(this.file)
    ).toString();

    let data: ConfigData;
    try {
      data = configSchema.parse(JSON.parse(rawData));
    } catch (err) {
      if (err instanceof ZodError) {
        console.error(err.toString());
      } else {
        console.error(err);
      }
      console.error('Invalid configuration file detected.');
      this.invalid = true;
      return;
    }

    if (this.invalid) {
      console.log('Successfully synced configuration file.');
      this.invalid = false;
    }

    Object.assign(this, data);

    this.emit('change');
  }

  async update() {
    const data: ConfigData = {
      sip: this.sip,
      alarms: this.alarms,
    };

    await this.writeToFile(data);
  }
}

export const configFile = new ConfigFile(configFilePath);
