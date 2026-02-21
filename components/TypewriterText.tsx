"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  className?: string;
  cps?: number; // characters per second
};

function getReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function TypewriterText({ text, className, cps = 45 }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(true); // SSR/CSR 초기 렌더를 동일하게(커서/애니메이션 X)

  useEffect(() => {
    setMounted(true);
    setReduced(getReducedMotion());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (reduced) {
      setVisibleCount(text.length);
      return;
    }

    setVisibleCount(0);
    if (!text) return;

    const intervalMs = Math.max(10, Math.floor(1000 / cps));
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [text, cps, reduced, mounted]);

  const shown = text.slice(0, visibleCount);

  return (
    <pre className={className}>
      {shown}
      {mounted && !reduced && visibleCount < text.length ? (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse align-middle bg-gold/70" aria-hidden="true" />
      ) : null}
    </pre>
  );
}

