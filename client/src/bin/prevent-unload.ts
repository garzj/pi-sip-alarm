import { useEffect } from 'react';

const preventUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault?.();
  e.returnValue = '';
  return '';
};

export function usePreventUnload(prevent: boolean) {
  useEffect(() => {
    if (prevent) {
      window.addEventListener('beforeunload', preventUnload);

      return () => window.removeEventListener('beforeunload', preventUnload);
    }
  }, [prevent]);
}
