import { z } from 'zod';
import { procItemSchema } from './alarm-process';

export const alarmSchema = z.object({
  name: z.string(),
  active: z.boolean(),
  gpio: z.number().int(),
  process: z.array(procItemSchema),
});
export type AlarmData = z.TypeOf<typeof alarmSchema>;

export const sipSchema = z.object({
  proxy: z.string(),
  user: z.string(),
  password: z.string(),
});
export type SipData = z.TypeOf<typeof sipSchema>;

export const configSchema = z.object({
  sip: sipSchema,
  alarms: z.record(alarmSchema),
});
export type ConfigData = z.TypeOf<typeof configSchema>;

export type AlarmNames = { [id: string]: string };
