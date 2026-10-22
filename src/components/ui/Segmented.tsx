import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  label: string;
}

export default function Segmented<T extends string>({ value, options, onChange, className, label }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex rounded-full border border-line bg-white/5 p-0.5', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors sm:text-[13px]',
              selected ? 'bg-white text-black' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
