import { socketEmit, useSocketLoader, useSocketOn } from '@/bin/socket';
import { SipData } from '@shared/schema/config-file';
import React, { useMemo } from 'react';
import equal from 'fast-deep-equal';
import { Prompt } from 'react-router-dom';
import { useState } from 'react';
import { useCallback } from 'react';
import './Sip.css';
import { usePreventUnload } from '@/bin/prevent-unload';

export const Sip: React.FC = () => {
  const [sip, setSip] = useState<SipData | null>(null);
  const [savedSip, setSavedSip] = useState<SipData | null>(null);

  const dirtyFlag = useMemo(() => !equal(savedSip, sip), [savedSip, sip]);
  usePreventUnload(dirtyFlag);

  const [checkState, setCheckState] = useState<
    'NONE' | 'CHECKING' | 'SUCCESS' | 'FAILURE'
  >('NONE');
  const [checkedSip, setCheckedSip] = useState<SipData | null>(null);

  const dirtyCheck = useMemo(() => !equal(checkedSip, sip), [checkedSip, sip]);

  const configLoader = useCallback(() => {
    socketEmit('config-sip-get', (sip: SipData) => {
      setSip(sip);
      setSavedSip(sip);
    });
  }, [setSip, setSavedSip]);
  useSocketLoader(configLoader);

  const handleSave = () => {
    if (!sip) return;
    if (!savedSip) return;

    socketEmit('config-sip-set', savedSip, sip, (saved: boolean) => {
      if (saved) {
        setSavedSip(sip);
      } else {
        if (
          window.confirm(
            'The sip config has been modified from another source. Override changes?'
          )
        ) {
          socketEmit('config-sip-override', sip);
          setSavedSip(sip);
        }
      }
    });
  };

  const handleChecked = useCallback(
    (success: boolean, sip: SipData) => {
      setCheckState(success ? 'SUCCESS' : 'FAILURE');
      setCheckedSip(sip);
    },
    [setCheckState, setCheckedSip]
  );
  useSocketOn('config-sip-checked', handleChecked);

  const handleCheck = () => {
    setCheckState('CHECKING');
    setCheckedSip(sip);
    socketEmit('config-sip-check', sip);
  };

  const handleChange = (
    field: keyof SipData,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSip((sip) => {
      if (!sip) return null;
      return { ...sip, [field]: e.target.value };
    });
  };

  return (
    <>
      <div className='big-tab sip'>
        {sip !== null ? (
          <>
            <Prompt
              when={dirtyFlag}
              message={(params) =>
                params.pathname === '/'
                  ? true
                  : 'You have unsaved changes, are you sure you want to leave?'
              }
            />

            <label htmlFor='proxy'>Proxy</label>
            <input
              type='text'
              name='proxy'
              value={sip.proxy}
              onChange={(e) => handleChange('proxy', e)}
            />
            <br />
            <br />

            <label htmlFor='user'>User</label>
            <input
              type='text'
              name='user'
              value={sip.user}
              onChange={(e) => handleChange('user', e)}
            />
            <br />
            <br />

            <label htmlFor='password'>Password</label>
            <input
              type='password'
              name='password'
              value={sip.password}
              onChange={(e) => handleChange('password', e)}
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
        </button>
        <button className='btn' onClick={handleCheck}>
          {!dirtyCheck && checkState !== 'NONE' ? (
            <div className='flag-container'>
              <div className={`sip-check ${checkState.toLowerCase()}`}></div>
            </div>
          ) : null}
          Check
        </button>
      </div>
    </>
  );
};
