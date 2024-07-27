import { useState, useCallback } from 'react';
import './Alarms.css';
import { Alarm } from './Alarm';
import { NavLink, useLocation } from 'react-router-dom';
import { AlarmNames } from '../../../shared/schema/config-file';
import { socketEmit, useSocketLoader, useSocketOn } from '../bin/socket';

export const Alarms: React.FC = () => {
  const [alarmNames, setAlarmNames] = useState<AlarmNames>({});

  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const alarmPath = pathParts[pathParts.length - 1];
  const alarmId = Object.prototype.hasOwnProperty.call(alarmNames, alarmPath)
    ? alarmPath
    : null;

  useSocketLoader(useCallback(() => socketEmit('config-alarms-get'), []));

  useSocketOn('config-alarms-set', setAlarmNames);

  const addAlarm = () => socketEmit('config-alarms-add');

  return (
    <>
      <nav>
        <ul>
          {Object.entries(alarmNames).map(([alarmId, alarmName]) => (
            <li key={alarmId}>
              <NavLink
                className={(isActive) =>
                  'alarm-name' + (isActive ? '-active' : '')
                }
                to={`/alarms/${alarmId}`}
              >
                {alarmName}
              </NavLink>
            </li>
          ))}
          <button className='btn alarm-name-add' onClick={addAlarm}>
            Add
          </button>
        </ul>
      </nav>
      {alarmId == null ? null : <Alarm id={alarmId} />}
    </>
  );
};
