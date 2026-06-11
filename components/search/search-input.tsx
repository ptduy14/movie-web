'use client';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from 'i18n/routing';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useDebounce } from '../hooks/useDebounce';

export default function SearchInput() {
  const t = useTranslations('lists');
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
    <div className="relative h-full w-full">
      <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        className="h-full w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 text-base text-white outline-none transition-colors placeholder:text-gray-500 focus:border-brand lg:text-lg"
        placeholder={t('searchPlaceholder')}
        onChange={(e) => setInputValue(e.target.value)}
        defaultValue={searchParams.get('name')?.toString()}
      />
    </div>
  );
}
