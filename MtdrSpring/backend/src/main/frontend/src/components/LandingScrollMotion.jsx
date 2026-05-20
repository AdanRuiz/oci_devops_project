import { useEffect, useRef, useState } from 'react';

function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -64px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function revealClass(visible, extra = '') {
  return `${visible ? 'landing-scroll-visible' : 'landing-scroll-hidden'} ${extra}`.trim();
}

export function LandingScrollSection({ children, className = '', delay = 0, ...rest }) {
  const [ref, visible] = useScrollReveal();
  return (
    <section
      ref={ref}
      className={revealClass(visible, className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </section>
  );
}

export function LandingScrollBlock({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={revealClass(visible, className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingScrollStagger({ children, className = '' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <ul ref={ref} className={revealClass(visible, className)}>
      {children}
    </ul>
  );
}

export function LandingScrollStaggerItem({ children, className = '', index = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <li
      ref={ref}
      className={revealClass(visible, className)}
      style={{ transitionDelay: `${Math.min(index * 90, 270)}ms` }}
    >
      {children}
    </li>
  );
}

export function LandingScrollStaggerGrid({ children, className = '' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={revealClass(visible, className)}>
      {children}
    </div>
  );
}

export function LandingScrollCard({ children, className = '', index = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={revealClass(visible, className)}
      style={{ transitionDelay: `${Math.min(index * 100, 200)}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingScrollStaggerList({ children, className = '' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <ol ref={ref} className={revealClass(visible, className)}>
      {children}
    </ol>
  );
}

export function LandingScrollStaggerListItem({ children, className = '', index = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <li
      ref={ref}
      className={revealClass(visible, className)}
      style={{ transitionDelay: `${Math.min(index * 70, 210)}ms` }}
    >
      {children}
    </li>
  );
}
