import { ProcessItem } from '@shared/schema/alarm-process';
import { AlarmData } from '@shared/schema/config-file';
import { BinaryValue, Gpio } from 'onoff';
import { CallData, PjcallRunner } from './PjcallRunner';
import { v4 as uuidv4 } from 'uuid';
import { join, normalize } from 'path';
import { audioPath, tmpPath } from '@/config/paths';
import * as text2wav from 'text2wav';
import { unlink, writeFile } from 'fs/promises';
import { configFile } from '@/config-file';
const { HIGH } = Gpio;

export class Alarm {
  input?: Gpio;

  curItem: number | null = null;
  callIds: Set<number> = new Set();

  lastCallSuccess: boolean = true;

  audioGenerator: Promise<void> | null;
  audioFiles: { [key: number]: string } = {};

  static runner: PjcallRunner = new PjcallRunner();

  constructor(public readonly config: AlarmData) {
    // Generate audios beforehand
    this.audioGenerator = this.genAudios();

    try {
      // Watch and debounce gpio pin
      this.input = new Gpio(this.config.gpio, 'in', 'both', {
        debounceTimeout: 100,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.log(err);
        console.error(`Failed to watch GPIO ${this.config.gpio}.`);
      } else {
        // Always run active alarms in development
        this.onGpioChange(HIGH);
      }
    }

    this.input?.watch((err, value) => {
      if (err) {
        console.error(
          `${err}\n${this.getLogPrefix()} Failed to watch GPIO ${
            this.config.gpio
          }.`
        );
        return;
      }

      this.onGpioChange(value);
    });
  }

  private async genAudios() {
    // Generate all at once
    await Promise.all(
      this.config.process.map((item, i) =>
        (async () => {
          if (item.type === 'call' || item.type === 'callElse') {
            const audio = item.audio;
            if (audio.type === 'text') {
              // Generate audio from text
              const text = audio.text
                .replace('%gpio%', this.config.gpio.toString())
                .replace('%name%', this.config.name);
              const audioFile = join(tmpPath, `${uuidv4()}.wav`);

              try {
                const out = await text2wav(text, {
                  voice: 'en+f2',
                });
                await writeFile(audioFile, out);
              } catch (err) {
                return console.error(
                  `${this.getLogPrefix()} Could not generate audio file for item with index ${
                    this.curItem
                  }.`
                );
              }

              this.audioFiles[i] = audioFile;
            }
          }
        })()
      )
    );

    // Mark as done
    this.audioGenerator = null;
  }

  private async destroyAudios() {
    // Delete all at once
    await Promise.all(
      Object.entries(this.audioFiles).map(([i, audioFile]) =>
        (async () => {
          try {
            await unlink(audioFile);
          } catch (err) {
            console.error(
              `${err}\n${this.getLogPrefix()} Couln't delete audio file of item with index ${i}.`
            );
          }
        })()
      )
    );
  }

  onGpioChange(value: BinaryValue) {
    if (value) {
      this.processStart();
    } else {
      this.processEnd();
    }
  }

  processStart() {
    if (this.curItem !== null) return;

    console.log(
      `${this.getLogPrefix()} Starting process, because pin ${
        this.config.gpio
      } became active.`
    );

    this.curItem = 0;

    this.processStep();
  }

  getLogPrefix() {
    let prefix = `Alarm "${this.config.name}"`;
    if (this.curItem !== null) {
      prefix += `, step ${this.curItem + 1}/${this.config.process.length}`;
    }
    return `${prefix}:`;
  }

  nextStep() {
    if (this.curItem === null) return;

    this.curItem++;

    this.processStep();
  }

  processStep() {
    if (this.curItem === null) return;

    const curItem = this.curItem;
    if (curItem >= this.config.process.length || curItem < 0) {
      return this.processEnd();
    }

    const item = this.config.process[curItem];

    const setCallResult = async (
      item: Extract<ProcessItem, { type: 'call' | 'callElse' }>,
      err: string | null
    ) => {
      const success = err === null;
      if (success) {
        console.log(
          `${this.getLogPrefix()} Successfully called ${item.phone}.`
        );
      } else {
        console.error(err);
      }
      this.lastCallSuccess = success;

      this.nextStep();
    };

    const call = async (
      item: Extract<ProcessItem, { type: 'call' | 'callElse' }>
    ) => {
      let audioFile: string;

      if (item.audio.type === 'text') {
        // Wait for audio to generate
        if (this.audioGenerator !== null) {
          await this.audioGenerator;
        }

        if (!Object.prototype.hasOwnProperty.call(this.audioFiles, curItem)) {
          return setCallResult(
            item,
            `${this.getLogPrefix()} Previously failed to convert call text to an audio file while calling ${
              item.phone
            }.`
          );
        }

        audioFile = this.audioFiles[curItem];
      } else {
        // Get audio file from user input
        audioFile = join(
          audioPath,
          normalize(item.audio.file).replace(/^(\.\.(\/|\\|$))+/, '')
        );
      }

      const callData: CallData = {
        phone: item.phone,
        audioFile,
        playTimes: item.audio.playTimes,
      };
      Alarm.runner.call(
        callData,
        (err, callId) => {
          this.lastCallSuccess = !err;

          callId !== null && this.callIds.delete(callId);

          return setCallResult(
            item,
            err ? `${this.getLogPrefix()} ${err}` : null
          );
        },
        (call) => this.callIds.add(call.callId)
      );
    };

    if (item.type === 'call') {
      call(item);
    } else if (item.type === 'callElse') {
      if (!this.lastCallSuccess) {
        call(item);
      }
    } else if (item.type === 'sleep') {
      console.log(`${this.getLogPrefix()} Sleeping for ${item.delay} seconds.`);
      setTimeout(() => this.nextStep(), item.delay * 1000);
    } else {
      console.log(
        `${this.getLogPrefix()} Jumping to alarm step: ${item.index + 1}`
      );
      this.curItem = item.index;
      setTimeout(() => this.processStep(), 0);
    }
  }

  processEnd() {
    if (this.curItem === null) return;

    this.curItem = null;
    this.lastCallSuccess = true;

    console.log(`${this.getLogPrefix()} Ending process.`);

    for (const callId of this.callIds) {
      Alarm.runner.hangup(callId);
    }
  }

  destroy() {
    this.input?.unexport();
    this.destroyAudios();
    this.processEnd();
  }
}

// Update registration
configFile.on('change', () => {
  Alarm.runner.register(configFile.sip);
});
