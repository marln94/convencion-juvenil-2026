import type { HTMLAttributes, ReactNode } from "react";

export type PillVariant = "default" | "red" | "green" | "amber";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  children: ReactNode;
}

export function Pill({ variant = "default", className = "", children, ...props }: PillProps) {
  const variantClasses = {
    default: "pill--default",
    red: "pill--red",
    green: "pill--green",
    amber: "pill--amber",
  };

  return (
    <span className={`pill ${variantClasses[variant]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}