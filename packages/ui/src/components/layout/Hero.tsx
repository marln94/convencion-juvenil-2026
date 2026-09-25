import type { HTMLAttributes, ReactNode } from "react";

export interface HeroProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Hero({ children, className = "", ...props }: HeroProps) {
  return (
    <div className={`hero ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}