import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardTagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function CardTag({ children, className = "", ...props }: CardTagProps) {
  return (
    <span className={`card__tag ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}