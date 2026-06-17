'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from 'i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import {
  IoChevronDown,
  IoClose,
  IoCheckmark,
  IoLayersOutline,
  IoOptionsOutline,
  IoSwapVertical,
} from 'react-icons/io5';
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
  count,
}: {
  title: string;
  dimensions: FilterDimension[];
  /** Catalog-wide result total shown next to the title. Hidden when null/undefined. */
  count?: number | null;
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
  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Sort is a separate concern (kept in its own control), so clear filters only.
    ['category', 'country', 'year'].forEach((k) => params.delete(k));
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

  const currentSortLabel = sortOptions.find((o) => o.value === sort)?.label ?? t('sortLatest');

  const activeFilters: { param: 'category' | 'country' | 'year'; label: string }[] = [];
  if (category) activeFilters.push({ param: 'category', label: localizedCategory(category, locale) });
  if (country) activeFilters.push({ param: 'country', label: localizedCountry(country, locale) });
  if (year) activeFilters.push({ param: 'year', label: year });

  return (
    <div>
      <div className="space-y-4">
        {/* Eyebrow — gives the bare title an editorial "section landing" feel (Apple TV). */}
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          <IoLayersOutline size={13} />
          {t('browse')}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
          {typeof count === 'number' && (
            <span className="text-sm text-white/50">{t('count', { count })}</span>
          )}
        </div>

        {/* Control bar — filters left, sort pushed right (Netflix / Prime pattern). */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-0.5 hidden items-center gap-1.5 text-xs text-white/40 sm:flex">
              <IoOptionsOutline size={14} />
              {t('filtersLabel')}
            </span>
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
          </div>

          <FilterDropdown
            label={t('sort')}
            value={sort}
            options={sortOptions}
            onChange={(v) => setParam('sort', v)}
            variant="ghost"
            align="right"
            display={`${t('sort')}: ${currentSortLabel}`}
            leadingIcon={<IoSwapVertical size={15} />}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-white/10" />

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <span className="text-xs text-white/40">{t('activeLabel')}:</span>
          {activeFilters.map((f) => (
            <button
              key={f.param}
              type="button"
              onClick={() => setParam(f.param, '')}
              className="flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand-muted px-3 py-1 text-xs text-white transition-colors hover:border-brand"
            >
              {f.label}
              <IoClose size={14} className="text-brand" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 text-xs text-brand transition-colors hover:text-brand-hover"
          >
            {t('clear')}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  variant = 'filter',
  align = 'left',
  display,
  leadingIcon,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** 'filter' = bordered pill (left group); 'ghost' = borderless text (the sort control). */
  variant?: 'filter' | 'ghost';
  align?: 'left' | 'right';
  /** Override the trigger text (e.g. the sort control always shows "Sort: Latest"). */
  display?: string;
  leadingIcon?: ReactNode;
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

  const buttonText = display ?? (active ? `${label}: ${current?.label ?? value}` : label);
  const buttonClass =
    variant === 'ghost'
      ? `flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
          open ? 'text-white' : 'text-gray-300 hover:text-white'
        }`
      : `flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
          active
            ? 'border-brand bg-white/5 text-white'
            : 'border-white/15 text-gray-300 hover:border-white/30'
        }`;

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className={buttonClass}>
        {leadingIcon}
        <span className="whitespace-nowrap">{buttonText}</span>
        <IoChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-2 max-h-72 w-44 overflow-y-auto rounded-lg border border-white/10 bg-black/95 py-1 shadow-custom backdrop-blur-md ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
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
