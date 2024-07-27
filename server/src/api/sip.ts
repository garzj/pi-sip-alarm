import equal from 'fast-deep-equal';
import { ProvideAPI } from '.';
import { SipData, sipSchema } from '../../../shared/schema/config-file';
import { configFile } from '../config-file';
import { PjcallRunner } from '../sip/PjcallRunner';

export const provideSipApi: ProvideAPI = (io) => {
  io.on('connection', (socket) => {
    // GET / SET:
    socket.on('config-sip-get', (callback: (sip: SipData) => void) => {
      if (typeof callback !== 'function') return;

      callback(configFile.sip);
    });

    socket.on(
      'config-sip-set',
      (old: SipData, sip: SipData, callback: (saved: boolean) => void) => {
        if (typeof callback !== 'function') return;
        if (!sipSchema.safeParse(old).success) return;
        if (!sipSchema.safeParse(sip).success) return;

        if (equal(configFile.sip, old)) {
          configFile.sip = sip;
          configFile.update();
          callback(true);
        } else {
          callback(false);
        }
      }
    );

    socket.on('config-sip-override', (sip: SipData) => {
      if (!sipSchema.safeParse(sip).success) return;

      configFile.sip = sip;
      configFile.update();
    });

    // REGISTRATION CHECK:
    socket.on('config-sip-check', (sip: SipData) => {
      if (!sipSchema.safeParse(sip).success) return;

      const runner = new PjcallRunner();
      runner.register(sip, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Successful registration as ${runner.getUserAddress()}.`);
        }

        socket.emit('config-sip-checked', !err, sip);

        runner.destroy();
      });
    });
  });
};
