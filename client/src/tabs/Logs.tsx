import { socketEmit, useSocketLoader, useSocketOn } from '@/bin/socket';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import './Logs.css';

export const Logs: React.FC = () => {
  const [logFilePath, setLogFilePath] = useState('/dev/null');
  const [log, setLog] = useState<string>('Loading...');
  const logRef = useRef<HTMLPreElement | null>(null);

  const logLoader = useCallback(() => {
    socketEmit('log-get', (log: string, logFilePath: string) => {
      setLog(log);
      setLogFilePath(logFilePath.replace(/.*\/data/, './data'));
    });
  }, [setLog, setLogFilePath]);
  useSocketLoader(logLoader);

  const logLine = useCallback(
    (line: string) => {
      setLog((log) => {
        return `${log}${line}`;
      });
    },
    [setLog]
  );
  useSocketOn('log', logLine);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className='big-tab logs'>
      <pre className='full-log-info'>
        A full log can be found in {logFilePath}.
      </pre>
      <pre ref={logRef} className='log'>
        {log}
      </pre>
    </div>
  );
};
