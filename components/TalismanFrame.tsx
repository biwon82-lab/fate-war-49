"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function TalismanFrame({ children, className, title, subtitle }: Props) {
  return (
    <section className={`talisman-frame ${className ?? ""}`}>
      {/* corners */}
      <span className="talisman-corner left-5 top-5" aria-hidden="true" />
      <span className="talisman-corner right-5 top-5" aria-hidden="true" />
      <span className="talisman-corner bottom-5 left-5" aria-hidden="true" />
      <span className="talisman-corner bottom-5 right-5" aria-hidden="true" />

      <div className="relative z-10 p-6 md:p-8">
        {title ? (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gold/90">{title}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-gold/30 via-white/10 to-crimson/30" />
            </div>
            {subtitle ? <p className="mt-2 text-sm text-white/65">{subtitle}</p> : null}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}

