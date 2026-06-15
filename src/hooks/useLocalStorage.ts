import { useCallback } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const getValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(getValue()) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        console.error(`Error setting localStorage key "${key}":`, err);
      }
    },
    [key, getValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.error(`Error removing localStorage key "${key}":`, err);
    }
  }, [key]);

  return [getValue(), setValue, removeValue] as const;
};
