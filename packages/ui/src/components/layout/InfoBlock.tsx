import type { HTMLAttributes, ReactNode } from "react";

export interface InfoBlockProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function InfoBlock({ children, className = "", ...props }: InfoBlockProps) {
  return (
    <div className={`info-block ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}