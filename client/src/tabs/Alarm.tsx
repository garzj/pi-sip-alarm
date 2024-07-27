import equal from 'fast-deep-equal';
import React, { useCallback, useMemo, useState } from 'react';
import { AlarmProcess } from '../alarm-process/AlarmProcess';
import { AlarmData } from '../../../shared/schema/config-file';
import { socketEmit, useSocketLoader } from '../bin/socket';
import { usePreventUnload } from '../bin/prevent-unload';
import { IntegerInput } from '../input/IntegerInput';
import { DirtyFlagWarning } from './DirtyFlagWarning';

interface Props {
  id: string;
}

export const Alarm: React.FC<Props> = ({ id }) => {
  const [alarm, setAlarm] = useState<AlarmData | null>(null);
  const [savedAlarm, setSavedAlarm] = useState<AlarmData | null>(null);

  const alarmLoader = useCallback(
    () =>
      socketEmit('config-alarm-get', id, (alarm: AlarmData | null) => {
        setAlarm(alarm);
        setSavedAlarm(alarm);
      }),
    [id, setAlarm, setSavedAlarm]
  );
  useSocketLoader(alarmLoader);

  const dirtyFlag = useMemo(
    () => !equal(savedAlarm, alarm),
    [savedAlarm, alarm]
  );
  usePreventUnload(dirtyFlag);

  const handleSave = () => {
    if (!alarm) return;
    if (!savedAlarm) return;

    socketEmit('config-alarm-set', id, savedAlarm, alarm, (saved: boolean) => {
      if (saved) {
        setSavedAlarm(alarm);
      } else {
        if (
          window.confirm(
            'This alarm has been modified from another source. Override changes?'
          )
        ) {
          socketEmit('config-alarm-override', id, alarm);
          setSavedAlarm(alarm);
        }
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Do you really wanna delete this alarm?')) {
      socketEmit('config-alarm-delete', id);
    }
  };

  const changeAlarm = (callback: (alarm: AlarmData) => void) =>
    setAlarm((old) => {
      const alarm = Object.assign({}, old);
      if (alarm) callback(alarm);

      return alarm;
    });

  return (
    <>
      <div className='big-tab alarm'>
        {alarm !== null ? (
          <>
            <DirtyFlagWarning dirtyFlag={dirtyFlag} path={`/alarms/${id}`} />

            <label htmlFor='name'>Name</label>
            <input
              type='text'
              name='name'
              value={alarm.name}
              onChange={(e) =>
                changeAlarm((alarm) => {
                  alarm.name = e.target.value;
                })
              }
              onBlur={(e) =>
                e.target.value === '' &&
                changeAlarm((alarm) => {
                  alarm.name = '';
                })
              }
            />
            <br />
            <br />

            <label htmlFor='active'>Active</label>
            <input
              type='checkbox'
              checked={alarm.active}
              onChange={(e) =>
                changeAlarm((alarm) => {
                  alarm.active = !alarm.active;
                })
              }
            />
            <br />
            <br />

            <label htmlFor='gpio'>Gpio pin</label>
            <IntegerInput
              name='gpio'
              value={alarm.gpio}
              onChange={(val) =>
                val !== null &&
                changeAlarm((alarm) => {
                  alarm.gpio = val;
                })
              }
            />
            <br />
            <br />

            <label>Alarm process</label>
            <AlarmProcess
              process={alarm.process}
              onChange={(process) => {
                changeAlarm((alarm) => {
                  alarm.process = process;
                });
              }}
            />
          </>
        ) : (
          'Loading...'
        )}
      </div>
      <div className='action-bar'>
        <button className='btn' onClick={handleSave}>
          {dirtyFlag ? (
            <div className='flag-container'>
              <div className='dirty-flag'></div>
            </div>
          ) : null}
          Save
        </button>{' '}
        <div className='flex-grow'></div>
        <button className='btn' onClick={handleDelete}>
          Delete
        </button>
      </div>
    </>
  );
};
