import { Alarm } from './Alarm';
import { configFile } from '@/config-file';
import equal = require('fast-deep-equal');
import { Gpio } from 'onoff';

if (!Gpio.accessible) {
  console.error(`Could not access your GPIO device:
    /sys/class/gpio/export
Make sure the server is running on a Raspberry PI and has the correct access rights to this device.`);
}

type Alarms = Record<string, Alarm>;

let alarms: Alarms = {};
process.on('exit', () => {
  for (let alarm of Object.values(alarms)) {
    alarm.destroy();
  }
});

configFile.on('change', () => {
  const newAlarms: Alarms = {};

  const alarmIds = new Set([
    ...Object.keys(configFile.alarms),
    ...Object.keys(alarms),
  ]);
  for (let alarmId of alarmIds) {
    const isOld = Object.prototype.hasOwnProperty.call(alarms, alarmId);
    const isNew =
      Object.prototype.hasOwnProperty.call(configFile.alarms, alarmId) &&
      configFile.alarms[alarmId].active;
    const isEqual =
      isOld &&
      isNew &&
      equal(alarms[alarmId].config, configFile.alarms[alarmId]);

    if (isEqual) {
      // Reuse old as new
      newAlarms[alarmId] = alarms[alarmId];
    } else {
      if (isOld) {
        // Destoy old
        alarms[alarmId].destroy();
      }

      if (isNew) {
        // Create new
        newAlarms[alarmId] = new Alarm(configFile.alarms[alarmId]);
      }
    }
  }

  alarms = newAlarms;
});
