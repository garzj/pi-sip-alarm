import {
  ProcessItem,
  procItemSchemas,
} from '../../../shared/schema/alarm-process';
import { AlarmData } from '../../../shared/schema/config-file';
import './AlarmProcess.css';
import { AlarmProcessItem } from './AlarmProcessItem';

interface Props {
  process: AlarmData['process'];
  onChange: (process: AlarmData['process']) => void;
}

export const AlarmProcess: React.FC<Props> = ({ process, onChange }) => {
  const handleItemSwap = (idx: number, otherIdx: number) => {
    const newProc = [...process];
    const tmp = newProc[idx];
    newProc[idx] = newProc[otherIdx];
    newProc[otherIdx] = tmp;
    onChange(newProc);
  };

  return (
    <div className='process-section'>
      {process.map((item, idx) => (
        <AlarmProcessItem
          key={idx}
          item={item}
          itemsCount={process.length}
          onChange={(item: ProcessItem) =>
            onChange(process.map((old, i) => (i === idx ? item : old)))
          }
          onMoveUp={idx === 0 ? undefined : () => handleItemSwap(idx, idx - 1)}
          onMoveDown={
            idx >= process.length - 1
              ? undefined
              : () => handleItemSwap(idx, idx + 1)
          }
          onDelete={() => onChange(process.filter((_, i) => i !== idx))}
        />
      ))}
      <button
        className='btn'
        onClick={() => {
          const procItem = procItemSchemas.call.parse({ type: 'call' });
          onChange([...process, procItem]);
        }}
      >
        Add
      </button>
    </div>
  );
};
