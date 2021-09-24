import { z } from 'zod';

export const audioSchemas = {
  file: z.object({
    type: z.literal('file'),
    file: z.string().default('audio.wav'),
    playTimes: z.number().int().default(3),
  }),
  text: z.object({
    type: z.literal('text'),
    text: z
      .string()
      .default(
        'Attention please. Your Raspberry PI triggered an alarm. Pin %gpio% became active.'
      ),
    playTimes: z.number().int().default(3),
  }),
};

const av = Object.values(audioSchemas);
export const audioSchema = z
  .union([av[0], av[1], ...av.slice(2, av.length)])
  .default(audioSchemas['text'].parse({ type: 'text' }));
export type ProcessAudio = z.TypeOf<typeof audioSchema>;

export const procItemSchemas = {
  call: z.object({
    type: z.literal('call'),
    phone: z.string().default('00018004444444'),
    audio: audioSchema,
  }),
  callElse: z.object({
    type: z.literal('callElse'),
    phone: z.string().default('00018004444444'),
    audio: audioSchema,
  }),
  sleep: z.object({
    type: z.literal('sleep'),
    delay: z.number().int().default(600),
  }),
  jumpTo: z.object({
    type: z.literal('jumpTo'),
    index: z.number().default(0),
  }),
};

const pv = Object.values(procItemSchemas);
export const procItemSchema = z.union([
  pv[0],
  pv[1],
  ...pv.splice(2, pv.length),
]);
export type ProcessItem = z.TypeOf<typeof procItemSchema>;
