import { ChildProcess, spawn } from 'child_process';
import { SipData } from '@shared/schema/config-file';
import { pjcallBinPath } from '@/config/paths';

export type CallData = {
  phone: string;
  audioFile: string;
  playTimes: number;
};

type RegCallback = (err: string | null) => void;

type CallCallback = (err: string | null, callId: number | null) => void;
type CallInitCallback = (call: Call) => void;
type NewCall = {
  callData: CallData;
  cb?: CallCallback;
  initCb?: CallInitCallback;
};
type Call = Omit<NewCall, 'initCb'> & { callId: number };

export class PjcallRunner {
  static maxRestarts = 5;
  restarted = 0;

  private registered = false;

  proc: ChildProcess | null = null;

  private sip: SipData | null = null;

  private regStack: { cb?: RegCallback }[] = [];
  private callStack: NewCall[] = [];
  private calls: {
    [callId: number]: Call;
  } = {};

  private output = '';

  private unexpectedExitHandler: (() => void) | null = null;
  private nodeExitHandler: (() => void) | null;

  constructor() {
    this.run();
    this.nodeExitHandler = () => this.destroy();
  }

  getUserAddress() {
    return `${this.sip?.user}@${this.sip?.proxy}`;
  }

  getCallAddress(callData: CallData) {
    return `sip:${callData.phone}@${this.sip?.proxy}`;
  }

  register(sip: SipData, cb?: RegCallback) {
    this.sip = sip;

    if (!this.proc?.stdin) {
      return cb?.(
        `Failed to register as ${this.getUserAddress()}. No input stream to write to.`
      );
    }

    this.proc.stdin.write(`r ${sip.proxy} ${sip.user} ${sip.password}\n`);

    this.regStack.push({ cb });
  }

  call(callData: CallData, cb: CallCallback, initCb?: CallInitCallback) {
    if (!this.proc?.stdin) {
      return cb?.(
        `Failed to call ${this.getCallAddress(
          callData
        )}. No input stream to write to.`,
        null
      );
    }

    if (!this.sip) {
      return cb?.(
        `Failed to call ${this.getCallAddress(
          callData
        )}. A registration has to be made first.`,
        null
      );
    }

    this.proc.stdin.write(
      `c ${this.sip.proxy} ${callData.phone} ${callData.audioFile} ${callData.playTimes}\n`
    );

    this.callStack.push({ callData, cb, initCb });
  }

  hangup(callId: number) {
    if (!Object.prototype.hasOwnProperty.call(this.calls, callId)) return;

    // Hangup the call
    this.proc?.stdin?.write(`h ${callId}`);
  }

  onData(data: string) {
    for (let line of data.split(/\r\n|\r|\n/)) {
      this.onLine(line);
    }
  }

  onLine(line: string) {
    if (line !== '') {
      this.output += line + '\n';
    }

    const parts = line.split(' ');

    if (parts.length <= 0) return;
    let event = parts[0];

    const getCallById = (arg: string | undefined): Call | null => {
      const callId = parseInt(parts[1]);
      if (
        !Number.isInteger(callId) ||
        !Object.prototype.hasOwnProperty.call(this.calls, callId)
      ) {
        return null;
      }
      return this.calls[callId];
    };

    if (event.startsWith('APP_ERR')) {
      console.error(`Pjcall app error: ${line}`);
    } else if (event.startsWith('CMD_')) {
      event = event.substr(4, event.length);

      if (event.startsWith('ERR')) {
        console.error(`Pjcall command error: ${line}`);
      }
    } else if (event.startsWith('REG_')) {
      event = event.substr(4, event.length);

      if (event.startsWith('ERR')) {
        const reg = this.regStack.shift();
        this.registered = false;
        reg?.cb?.(`Failed to register as ${this.getUserAddress()}: ${line}`);
      } else if (event.startsWith('STATE_REGISTERED')) {
        const reg = this.regStack.shift();
        this.registered = true;
        reg?.cb?.(null);
      }
    } else if (event.startsWith('CALL_')) {
      event = event.substr(5, event.length);

      if (event.startsWith('STATE_CALLING')) {
        const newCall = this.callStack.shift();
        if (!newCall) return;

        const callId = parseInt(parts[1]);
        if (!Number.isInteger(callId)) {
          return newCall.cb?.(
            `Error while calling ${callId}: Could not receive pjsua call id.`,
            null
          );
        }

        const call: Call = { ...newCall, callId };
        this.calls[callId] = call;
        newCall.initCb?.(call);
      } else if (event.startsWith('ERR')) {
        const call = getCallById(parts[1]);
        if (!call) return;

        const callAddress = this.getCallAddress(call.callData);
        call.cb?.(`Error while calling ${callAddress}: ${line}`, call.callId);
      } else if (event.startsWith('STATE_CONFIRMED')) {
        // Could return to process, when confirmed
        // const call = getCallById(parts[1]);
        // if (!call) return;
        // call.cb?.(null);
      } else if (event.startsWith('STATE_DECLINED')) {
        const call = getCallById(parts[1]);
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
      } else if (event.startsWith('STATE_HANGUP')) {
        // Return to process after hangup
        const call = getCallById(parts[1]);
        if (!call) return;

        call.cb?.(null, call.callId);
      }
    }
  }

  private run() {
    // Clear output
    this.output = '';

    // Spawn pjcall
    this.proc = spawn(pjcallBinPath, { stdio: ['pipe', 'pipe', 'pipe'] });

    // Attach to output
    if (!this.proc.stdout || !this.proc.stderr || !this.proc.stdin) {
      return console.error(`Couln't attach to the stdio of the pjcall client.`);
    }
    this.proc.stdout.on('data', (data) => this.onData(`${data}`));
    this.proc.stderr.on('data', (data) => this.onData(`${data}`));

    // Handle unexpected exits -> restart
    this.unexpectedExitHandler = () => {
      console.error(
        `${this.output}The pjcall process closed unexpectedly. There is likely additional output above.`
      );

      if (this.restarted >= PjcallRunner.maxRestarts) {
        return console.error(
          `Already reached a maximum of ${PjcallRunner.maxRestarts} restarts. Terminating...`
        );
      }

      this.restarted++;
      console.error(
        `Restarting... (${this.restarted}/${PjcallRunner.maxRestarts})`
      );

      this.run();
    };
    this.proc.on('exit', this.unexpectedExitHandler);

    // Kill on node exit
    process.on('exit', this.destroy.bind(this));
  }

  terminate() {
    if (this.proc) {
      if (this.unexpectedExitHandler) {
        this.proc.removeListener('exit', this.unexpectedExitHandler);
        this.unexpectedExitHandler = null;
      }

      this.proc.kill('SIGTERM');
    }
  }

  destroy() {
    if (this.nodeExitHandler) {
      process.removeListener('exit', this.nodeExitHandler);
      this.nodeExitHandler = null;
    }

    this.terminate();
  }
}
