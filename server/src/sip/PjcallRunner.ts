import { ChildProcess, spawn } from 'child_process';
import { pjcallEvents, PjcallEvents } from './pjcallEvents';
import { SipData } from '../../../shared/schema/config-file';
import { pjcallBinPath } from '../config/paths';

export type CallData = {
  phone: string;
  audioFile: string;
  playTimes: number;
};

type RegCallback = (err: string | null) => void;
type CmdReg = {
  type: 'registration';
  cb?: RegCallback;
};

type CallCallback = (err: string | null, callId?: number) => void;
type CallInitCallback = (call: Call) => void;
export type Call = Omit<CmdCall, 'type' | 'initCb'> & { callId: number };
type CmdCall = {
  type: 'call';
  callData: CallData;
  cb?: CallCallback;
  initCb?: CallInitCallback;
};

type CmdData = CmdReg | CmdCall;

export class PjcallRunner {
  static maxRestarts = 5;
  restarted = 0;

  proc: ChildProcess | null = null;

  cmdQueue: CmdData[] = [];

  sip: SipData | null = null;
  registered = false;

  calls: {
    [callId: number]: Call;
  } = {};

  private output = '';
  private pjcallExitHandler: (() => void) | null = null;
  private nodeExitHandler: (() => void) | null;

  constructor() {
    // Kill on node exit
    this.nodeExitHandler = () => this.destroy();
    process.on('exit', this.nodeExitHandler);

    this.run();
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

    this.cmdQueue.push({ type: 'registration', cb });
  }

  shiftReg(): CmdReg | undefined {
    const regIdx = this.cmdQueue.findIndex((c) => c.type === 'registration');
    const reg = <CmdReg>this.cmdQueue.splice(regIdx, 1)[0];
    return reg;
  }

  call(callData: CallData, cb: CallCallback, initCb?: CallInitCallback) {
    if (!this.proc?.stdin) {
      return cb?.(
        `Failed to call ${this.getCallAddress(
          callData
        )}. No input stream to write to.`
      );
    }

    if (!this.sip) {
      return cb?.(
        `Failed to call ${this.getCallAddress(
          callData
        )}. A registration has to be made first.`
      );
    }

    this.proc.stdin.write(
      `c ${this.sip.proxy} ${callData.phone} ${callData.audioFile} ${callData.playTimes}\n`
    );

    this.cmdQueue.push({ type: 'call', callData, cb, initCb });
  }

  getCallById(callIdStr: string | undefined): Call | null {
    if (callIdStr === undefined) return null;
    const callId = parseInt(callIdStr);
    if (!Number.isInteger(callId)) return null;
    if (!Object.prototype.hasOwnProperty.call(this.calls, callId)) return null;
    return this.calls[callId];
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

    let args = line.split(' ');

    if (args.length <= 0) return;
    let event = args[0];
    args = args.slice(1);

    const callEvent = (
      events: PjcallEvents,
      path: string[],
      line: string,
      args: string[]
    ) => {
      const eventName = path.shift();
      if (eventName === undefined || !Object.keys(events).includes(eventName))
        return;
      const event = events[eventName];
      if (typeof event === 'function') {
        event.bind(this)(line, args);
      } else {
        callEvent(event, path, line, args);
      }
    };
    callEvent(pjcallEvents, event.split('_'), line, args);
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
    this.pjcallExitHandler = () => {
      console.error(
        `${this.output}The pjcall process closed unexpectedly. There is likely additional output above.`
      );

      if (this.restarted >= PjcallRunner.maxRestarts) {
        this.terminate();
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
    this.proc.on('exit', this.pjcallExitHandler);
  }

  terminate() {
    let cmd: CmdData | undefined;
    while ((cmd = this.cmdQueue.shift())) {
      cmd.cb?.(`Pjcall has been terminated.`);
    }

    if (this.proc) {
      if (this.pjcallExitHandler) {
        this.proc.removeListener('exit', this.pjcallExitHandler);
        this.pjcallExitHandler = null;
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
