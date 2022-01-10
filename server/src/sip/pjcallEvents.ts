import { Call, PjcallRunner } from './PjcallRunner';

export type PjcallEvents = {
  [event: string]:
    | PjcallEvents
    | ((this: PjcallRunner, line: string, args: string[]) => void);
};

// TODO: Fix not waiting...

export const pjcallEvents: PjcallEvents = {
  APP: {
    ERR(line) {
      console.error(`Pjcall app error: ${line}`);
    },
  },
  CMD: {
    ERR(line) {
      const cmd = this.cmdQueue.shift();
      const err = `Pjcall command error: ${cmd ? cmd.type + ': ' : ''} ${line}`;
      if (!cmd?.cb) return console.error(err);
      cmd.cb(err);
    },
  },
  REG: {
    ERR(line) {
      this.registered = false;
      const reg = this.shiftReg();
      reg?.cb?.(`Failed to register as ${this.getUserAddress()}: ${line}`);
    },
    STATE: {
      REGISTERED() {
        this.registered = true;
        const reg = this.shiftReg();
        reg?.cb?.(null);
      },
    },
  },
  CALL: {
    ERR(line, args) {
      const call = this.getCallById(args[0]);
      if (!call) return;

      const callAddress = this.getCallAddress(call.callData);
      call.cb?.(`Error while calling ${callAddress}: ${line}`, call.callId);
    },
    STATE: {
      CALLING(line, args) {
        const newCall = this.cmdQueue.shift();
        if (!newCall || newCall.type !== 'call') return;

        const callId = parseInt(args[0]);
        if (!Number.isInteger(callId)) {
          return newCall.cb?.(
            `Error while calling ${callId}: Could not receive pjsua call id.`
          );
        }

        const call: Call = { ...newCall, callId };
        this.calls[callId] = call;
        newCall.initCb?.(call);
      },
      CONFIRMED(line, args) {},
      DECLINED(line, args) {
        const call = this.getCallById(args[0]);
        if (!call) return;

        if (!this.registered) {
          return call.cb?.(
            `Call to ${this.getCallAddress(
              call.callData
            )} failed due to an registration error.`,
            call.callId
          );
        }

        call.cb?.(
          `Call to ${this.getCallAddress(call.callData)} was declined.`,
          call.callId
        );
        delete this.calls[call.callId];
      },
      HANGUP(line, args) {
        const call = this.getCallById(args[0]);
        if (!call) return;

        // Run callback after hangup
        call.cb?.(null, call.callId);
        delete this.calls[call.callId];
      },
    },
  },
};
