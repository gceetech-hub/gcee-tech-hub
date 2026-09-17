import { useEffect, useRef } from 'react';

/** Adds `.reveal`/`.revealed` classes for fade-in + slide-up on scroll. */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      el.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    // Safety net: never leave content stuck at `opacity: 0`. If the observer
    // does not fire for any reason, reveal it shortly after mount so sections
    // can never collapse into large blank areas.
    const safety = window.setTimeout(() => el.classList.add('revealed'), 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return ref;
}
