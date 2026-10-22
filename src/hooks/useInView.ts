import { useEffect, useState } from 'react';

/**
 * Tracks whether the element is within `rootMargin` of the viewport.
 * With `once` (default) it latches to true the first time, for lazy loading.
 * Returns a callback ref, so elements that mount later are still observed.
 */
export function useInView<T extends Element>(rootMargin = '400px', once = true) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const latched = once && inView;

  useEffect(() => {
    if (!node || latched) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, latched, once, rootMargin]);

  return [setNode, inView] as const;
}
