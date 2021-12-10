import { v4 as uuidv4 } from 'uuid';
import { ProvideAPI } from '.';
import { configFile } from '@/config-file';
import { AlarmData, AlarmNames, alarmSchema } from '@shared/schema/config-file';
import equal = require('fast-deep-equal');

export const provideAlarmsApi: ProvideAPI = (io) => {
  function getAlarmNames() {
    const alarmNames: AlarmNames = {};
    for (let [alarmId, alarm] of Object.entries(configFile.alarms)) {
      alarmNames[alarmId] = alarm.name;
    }
    return alarmNames;
  }

  configFile.on('change', () => {
    io.emit('config-alarms-set', getAlarmNames());
  });

  io.on('connection', (socket) => {
    // ADD / GET / DELETE
    socket.on('config-alarms-add', () => {
      const id = uuidv4();
      configFile.alarms[id] = {
        gpio: 0,
        active: false,
        name: `new #${id.substring(0, 8)}`,
        process: [],
      };
      configFile.update();
    });

    socket.on('config-alarms-get', () =>
      socket.emit('config-alarms-set', getAlarmNames())
    );

    socket.on('config-alarm-delete', (id: string) => {
      if (typeof id !== 'string') return;

      if (!Object.prototype.hasOwnProperty.call(configFile.alarms, id)) return;
      delete configFile.alarms[id];
      configFile.update();
    });

    // GET / SET alarm
    socket.on(
      'config-alarm-get',
      (id: string, callback: (alarm: AlarmData | null) => void) => {
        if (typeof callback !== 'function') return;
        if (typeof id !== 'string') return;

        if (!Object.prototype.hasOwnProperty.call(configFile.alarms, id)) {
          return callback(null);
        }
        callback(configFile.alarms[id]);
      }
    );

    socket.on(
      'config-alarm-set',
      (
        id: string,
        old: AlarmData,
        alarm: AlarmData,
        callback: (saved: boolean) => void
      ) => {
        if (typeof callback !== 'function') return;
        if (!alarmSchema.safeParse(old).success) return;
        if (!alarmSchema.safeParse(alarm).success) return;
        if (alarm.name === '') alarm.name = '-';

        if (!Object.prototype.hasOwnProperty.call(configFile.alarms, id)) {
          return callback(false);
        }

        if (equal(configFile.alarms[id], old)) {
          configFile.alarms[id] = alarm;
          configFile.update();
          callback(true);
        } else {
          callback(false);
        }
      }
    );

    socket.on('config-alarm-override', (id: string, alarm: AlarmData) => {
      if (!alarmSchema.safeParse(alarm).success) return;
      if (alarm.name === '') alarm.name = '-';

      if (!Object.prototype.hasOwnProperty.call(configFile.alarms, id)) return;
      configFile.alarms[id] = alarm;
      configFile.update();
    });
  });
};
