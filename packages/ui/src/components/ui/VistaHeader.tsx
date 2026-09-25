import type { HTMLAttributes, ReactNode } from "react";

export interface VistaHeaderProps extends HTMLAttributes<HTMLDivElement> {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}

export function VistaHeader({ titulo, descripcion, acciones, className = "", ...props }: VistaHeaderProps) {
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 ${className}`.trim()} {...props}>
      <div>
        <h1 className="t-solid text-xl">{titulo}</h1>
        {descripcion ? <p className="t-eyebrow mt-1">{descripcion}</p> : null}
      </div>
      {acciones}
    </div>
  );
}