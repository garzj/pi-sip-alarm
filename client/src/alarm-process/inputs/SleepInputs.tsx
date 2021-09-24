import { IntegerInput } from '@/input/IntegerInput';
import { AlarmProcessInputs } from './AlarmProcessInput';

export const SleepInputs: AlarmProcessInputs<'sleep'> = ({
  item,
  onChange,
}) => {
  return (
    <>
      <br />
      <br />
      <label>Delay</label>
      <IntegerInput
        value={item.delay}
        onChange={(delay) => {
          const newItem = Object.assign({}, item);
          newItem.delay = delay;
          onChange(newItem);
        }}
      />
    </>
  );
};
