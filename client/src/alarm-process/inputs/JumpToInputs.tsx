import { IntegerInput } from '@/input/IntegerInput';
import { AlarmProcessInputs } from './AlarmProcessInput';

export const JumpToInputs: AlarmProcessInputs<'jumpTo'> = ({
  item,
  itemsCount,
  onChange,
}) => {
  return (
    <>
      <br />
      <br />
      <label>Index</label>
      <IntegerInput
        value={item.index}
        max={itemsCount - 1}
        onChange={(index) => {
          const newItem = Object.assign({}, item);
          newItem.index = index;
          onChange(newItem);
        }}
      />
    </>
  );
};
