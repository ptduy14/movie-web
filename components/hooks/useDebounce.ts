import { useEffect, useState } from 'react';

export const useDebounce = (value: string, delay = 500) => {
  const [searchValue, setSearchValue] = useState<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchValue(value);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return searchValue;
};
