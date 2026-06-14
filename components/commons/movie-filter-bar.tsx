'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from 'i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { IoChevronDown, IoClose, IoCheckmark } from 'react-icons/io5';
import {
  CATEGORY_MAP,
  COUNTRY_MAP,
  localizedCategory,
  localizedCountry,
} from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';
import type { MovieFilters } from 'services/movie-services';

export type FilterDimension = 'category' | 'country' | 'year';

/**
 * Translate the `sort` URL param into OPhim sort params. Exported so the
 * browse pages can build the same `MovieFilters` from the URL the bar writes.
 * Only `year` sorting is wired (verified supported); '' = API default order.
 */
export function parseSort(sort: string | null | undefined): Pick<MovieFilters, 'sortField' | 'sortType'> {
  if (sort === 'year_desc') return { sortField: 'year', sortType: 'desc' };
  if (sort === 'year_asc') return { sortField: 'year', sortType: 'asc' };
  return {};
}

interface Option {
  value: string;
  label: string;
}

/**
 * Browse-page filter bar. Reads/writes filter state to the URL (shareable),
 * so the browse page derives its fetcher straight from `useSearchParams`.
 * The page's own dimension (the route slug) is the heading, not a dropdown —
 * pass only the OTHER dimensions via `dimensions`.
 */
export default function MovieFilterBar({
  title,
  dimensions,
}: {
  title: string;
  dimensions: FilterDimension[];
}) {
  const t = useTranslations('filter');
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const category = searchParams.get('category') ?? '';
  const country = searchParams.get('country') ?? '';
  const year = searchParams.get('year') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const hasActive = Boolean(category || country || year || sort);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['category', 'country', 'year', 'sort'].forEach((k) => params.delete(k));
    const qs = params.toString();
    replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const categoryOptions = useMemo<Option[]>(
    () => [
      { value: '', label: t('all') },
      ...Object.keys(CATEGORY_MAP.vi).map((s) => ({ value: s, label: localizedCategory(s, locale) })),
    ],
    [locale, t]
  );
  const countryOptions = useMemo<Option[]>(
    () => [
      { value: '', label: t('all') },
      ...Object.keys(COUNTRY_MAP.vi).map((s) => ({ value: s, label: localizedCountry(s, locale) })),
    ],
    [locale, t]
  );
  const yearOptions = useMemo<Option[]>(() => {
    const current = new Date().getFullYear();
    const opts: Option[] = [{ value: '', label: t('all') }];
    for (let y = current; y >= current - 26; y--) opts.push({ value: String(y), label: String(y) });
    return opts;
  }, [t]);
  const sortOptions = useMemo<Option[]>(
    () => [
      { value: '', label: t('sortLatest') },
      { value: 'year_desc', label: t('sortYearDesc') },
      { value: 'year_asc', label: t('sortYearAsc') },
    ],
    [t]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold lg:text-3xl">{title}</h1>

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        {dimensions.includes('category') && (
          <FilterDropdown
            label={t('genre')}
            value={category}
            options={categoryOptions}
            onChange={(v) => setParam('category', v)}
          />
        )}
        {dimensions.includes('country') && (
          <FilterDropdown
            label={t('country')}
            value={country}
            options={countryOptions}
            onChange={(v) => setParam('country', v)}
          />
        )}
        {dimensions.includes('year') && (
          <FilterDropdown
            label={t('year')}
            value={year}
            options={yearOptions}
            onChange={(v) => setParam('year', v)}
          />
        )}
        <FilterDropdown
          label={t('sort')}
          value={sort}
          options={sortOptions}
          onChange={(v) => setParam('sort', v)}
        />

        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 flex shrink-0 items-center gap-1 px-2 py-2 text-sm text-brand transition-colors hover:text-brand-hover"
          >
            <IoClose size={16} /> {t('clear')}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== '';
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
          active
            ? 'border-brand text-white'
            : 'border-white/15 text-gray-300 hover:border-white/30'
        }`}
      >
        <span className="whitespace-nowrap">{active ? `${label}: ${current?.label ?? value}` : label}</span>
        {active ? (
          <span
            role="button"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="text-brand"
          >
            <IoClose size={16} />
          </span>
        ) : (
          <IoChevronDown
            size={16}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 max-h-72 w-44 overflow-y-auto rounded-lg border border-white/10 bg-black/95 py-1 shadow-custom backdrop-blur-md">
          {options.map((o) => (
            <button
              key={o.value || 'all'}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                o.value === value ? 'text-brand' : 'text-gray-200'
              }`}
            >
              <span>{o.label}</span>
              {o.value === value && <IoCheckmark size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
