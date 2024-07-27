import { ReactElement } from 'react';
import { AlarmProcessInputs } from './inputs/AlarmProcessInput';
import { CallInputs } from './inputs/CallInputs';
import { JumpToInputs } from './inputs/JumpToInputs';
import { SleepInputs } from './inputs/SleepInputs';
import {
  ProcessItem,
  procItemSchemas,
} from '../../../shared/schema/alarm-process';

interface Props {
  item: ProcessItem;
  itemsCount: number;
  onChange: (item: ProcessItem) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}

export const AlarmProcessItem: React.FC<Props> = ({
  item,
  itemsCount,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  function getBarBtnStyle(x: boolean): React.CSSProperties {
    return x
      ? {}
      : {
          background: 'none',
          color: '#ccc',
          cursor: 'default',
        };
  }

  function getInputs(): ReactElement {
    let Inputs: AlarmProcessInputs;

    switch (item.type) {
      case 'call':
        Inputs = CallInputs as AlarmProcessInputs;
        break;
      case 'callElse':
        Inputs = CallInputs as AlarmProcessInputs;
        break;
      case 'sleep':
        Inputs = SleepInputs as AlarmProcessInputs;
        break;
      case 'jumpTo':
        Inputs = JumpToInputs as AlarmProcessInputs;
        break;
    }

    return <Inputs item={item} itemsCount={itemsCount} onChange={onChange} />;
  }

  return (
    <div className='process-section process-item'>
      {/* Up, Down, Delete */}
      <div className='process-item-bar'>
        <button style={getBarBtnStyle(!!onMoveUp)} onClick={onMoveUp}>
          ˄
        </button>
        <button style={getBarBtnStyle(!!onMoveDown)} onClick={onMoveDown}>
          ˅
        </button>
        <button style={getBarBtnStyle(true)} onClick={onDelete}>
          x
        </button>
      </div>

      {/* Type selection */}
      <label>Type</label>
      <select
        value={item.type}
        onChange={(e) => {
          const type = e.target.value as ProcessItem['type'];
          const newItem = procItemSchemas[type].parse({ type });
          onChange(newItem);
        }}
      >
        {Object.keys(procItemSchemas).map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Remaining fields */}
      {getInputs()}
    </div>
  );
};
