import { useEffect, useRef, useCallback } from 'react';

export const useInfiniteScroll = (callback: () => void, hasMore: boolean) => {
  const observer = useRef<IntersectionObserver>();
  
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [callback, hasMore]);

  return lastElementRef;
};
