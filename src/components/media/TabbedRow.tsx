import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListQueryOptions } from '@/lib/queries';
import { useInView } from '@/hooks/useInView';
import Segmented from '@/components/ui/Segmented';
import { MediaRow } from './MediaRow';
import type { CardVariant } from './MediaCard';

interface TabbedRowProps {
  title: string;
  tabs: { value: string; label: string; query: ListQueryOptions; seeAllTo?: string }[];
  variant?: CardVariant;
  eager?: boolean;
}

/** One row, several sources: only the selected tab is fetched. */
export default function TabbedRow({ title, tabs, variant, eager }: TabbedRowProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [value, setValue] = useState(tabs[0].value);
  const tab = tabs.find((t) => t.value === value) ?? tabs[0];
  const { data, isPending } = useQuery({ ...tab.query, enabled: eager || inView });

  return (
    <div ref={ref} className={isPending ? 'min-h-[300px]' : undefined}>
      <MediaRow
        title={title}
        items={data}
        loading={isPending}
        variant={variant}
        seeAllTo={tab.seeAllTo}
        action={<Segmented label={title} value={value} onChange={setValue} options={tabs.map(({ value, label }) => ({ value, label }))} />}
      />
    </div>
  );
}
