import { ConfigData } from '@shared/schema/config-file';

export const defaultConfig: ConfigData = {
  sip: {
    proxy: 'tel.example.com',
    user: '42',
    password: 'supersecurepassword',
  },
  alarms: {
    '163af954-b938-4177-8668-47cf2f71e4d9': {
      name: 'Alarm 1',
      active: false,
      gpio: 0,
      process: [
        {
          type: 'call',
          phone: '77',
          audio: {
            type: 'file',
            file: 'audio.wav',
            playTimes: 3,
          },
        },
        {
          type: 'callElse',
          phone: '00018004444444',
          audio: {
            type: 'text',
            text: 'Attention please. Your Raspberry PI triggered an alarm. Pin %gpio% became active.',
            playTimes: 3,
          },
        },
        {
          type: 'sleep',
          delay: 600,
        },
        {
          type: 'call',
          phone: '77',
          audio: {
            type: 'file',
            file: 'audio.wav',
            playTimes: 3,
          },
        },
        {
          type: 'callElse',
          phone: '00018004444444',
          audio: {
            type: 'text',
            text: 'Attention please. Your Raspberry PI triggered an alarm. Pin %gpio% became active.',
            playTimes: 3,
          },
        },
        {
          type: 'sleep',
          delay: 3600,
        },
        {
          type: 'jumpTo',
          index: 3,
        },
      ],
    },
    'e5bbbd8b-9113-4b29-bfc1-dab21e8508bf': {
      name: 'Alarm 2',
      active: false,
      gpio: 1,
      process: [
        {
          type: 'call',
          phone: '56',
          audio: {
            type: 'text',
            text: 'Attention please. Your Raspberry PI triggered an alarm. Pin %gpio% became active.',
            playTimes: 3,
          },
        },
      ],
    },
  },
};
