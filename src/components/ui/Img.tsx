import { useCallback, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Load eagerly with high priority (above-the-fold hero images). */
  priority?: boolean;
}

/** Lazy, async-decoded image that fades in once loaded. */
export default function Img({ priority, className, onLoad, alt = '', ...props }: ImgProps) {
  const [loaded, setLoaded] = useState(false);
  // Images served from cache can finish before React attaches onLoad; check on mount too.
  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <img
      ref={ref}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={cn('transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      {...props}
    />
  );
}
