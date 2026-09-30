import esloganUrl from "@convencion/ui/assets/convencion-eslogan.webp";
import type { ImgHTMLAttributes } from "react";

// Dimensiones de la caja del archivo convertido, no las del artwork. El PNG de origen
// traía 5% de padding superior y ~1.2% lateral que son parte del encuadre del diseñador:
// recortarlos no es reversible. Declararlas evita el salto de layout al cargar el bitmap.
const ANCHO = 1664;
const ALTO = 667;

export const ESLOGAN = "Atrévete a ser diferente";

export interface SloganLockupProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
  className?: string;
  "aria-hidden"?: boolean;
}

export function SloganLockup({ className = "", ...props }: SloganLockupProps) {
  return (
    <img
      src={esloganUrl}
      alt={ESLOGAN}
      width={ANCHO}
      height={ALTO}
      className={`slogan-lockup ${className}`.trim()}
      {...props}
    />
  );
}
