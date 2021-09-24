import {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from 'react';

export const useStateRef = <T>(
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>] => {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  return [state, setState, stateRef];
};
