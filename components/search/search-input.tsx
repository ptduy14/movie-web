import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export default function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [inputValue, setInputValue] = useState<string>(searchParams.get('name')?.toString() || '');
  const searchValue = useDebounce(inputValue);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term.trim()) {
      params.set('name', term);
    } else {
      params.delete('name');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (searchParams.get('name')?.toString() === inputValue) return;
    handleSearch(searchValue);
  }, [searchValue]);

  return (
    <input
      type="text"
      className="w-full h-full text-black px-3 text-base lg:text-lg rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      placeholder="Nhập tên phim..."
      onChange={(e) => setInputValue(e.target.value)}
      defaultValue={searchParams.get('name')?.toString()}
    />
  );
}
