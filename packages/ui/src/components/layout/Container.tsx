import type { HTMLAttributes, ReactNode } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ children, className = "", ...props }: ContainerProps) {
  return (
    <div className={`container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}