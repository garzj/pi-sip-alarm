import { useState } from 'react';

interface Props {
  name?: string;
  className?: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
}

export const IntegerInput: React.FC<Props> = ({
  onChange,
  value,
  name,
  className,
  min,
  max,
}) => {
  const [text, setText] = useState<string>(value.toString());

  const [appliedValue, setAppliedValue] = useState<number>(value);
  if (value !== appliedValue) {
    setAppliedValue(value);
    setText(value.toString());
  }

  function clampMinMax(val: number) {
    if (min !== undefined && val < min) return min;
    if (max !== undefined && val > max) return max;
    return val;
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.validity.valid) return;
    setText(e.target.value);

    if (e.target.value !== '') {
      const val = parseInt(e.target.value);
      onChange?.(clampMinMax(val));
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    if (e.target.validity.valid && e.target.value === '') {
      onChange?.(clampMinMax(0));
    } else {
      setText(value.toString());
    }
  };

  return (
    <input
      type='number'
      className={className}
      name={name}
      min='0'
      step='1'
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
    ></input>
  );
};
