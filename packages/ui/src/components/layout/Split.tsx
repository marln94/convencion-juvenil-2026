import type { HTMLAttributes, ReactNode } from "react";

export interface SplitProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  reverse?: boolean;
}

export function Split({ children, className = "", reverse = false, ...props }: SplitProps) {
  return (
    <div className={`split ${reverse ? "split--reverse" : ""} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}