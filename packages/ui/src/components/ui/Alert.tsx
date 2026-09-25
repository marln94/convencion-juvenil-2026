import type { HTMLAttributes, ReactNode } from "react";

export type AlertVariant = "error" | "success" | "warning" | "info";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: ReactNode;
}

export function Alert({ variant = "error", className = "", children, ...props }: AlertProps) {
  const variantClasses = {
    error: "alert--error",
    success: "alert--success",
    warning: "alert--warning",
    info: "alert--info",
  };

  return (
    <div className={`alert ${variantClasses[variant]} ${className}`.trim()} role="alert" {...props}>
      {children}
    </div>
  );
}