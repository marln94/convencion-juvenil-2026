import type { HTMLAttributes, ReactNode } from "react";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Section({ children, className = "", ...props }: SectionProps) {
  return (
    <section className={`section ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}