import { ProcessItem } from '../../../../shared/schema/alarm-process';

export type AlarmProcessInputs<
  Type extends ProcessItem['type'] = ProcessItem['type']
> = React.FC<{
  item: Extract<ProcessItem, { type: Type }>;
  itemsCount: number;
  onChange: (item: ProcessItem) => void;
}>;
