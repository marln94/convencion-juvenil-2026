import neqUrl from "@convencion/ui/assets/convencion-neq.webp";
import type { CSSProperties } from "react";

// El mismo ≠ que sirve el favicon, derivado del set de iconos entregado. Antes este
// componente dibujaba un aspa geométrica en SVG; el símbolo suelto nunca llegó como SVG,
// pero sí llegó compuesto en el lockup del eslogan y suelto en los PNG del favicon.
//
// Dimensiones intrínsecas del asset, declaradas para reservar el espacio antes de que
// cargue el bitmap. El artwork trae ~6.9% de padding por lado: es el encuadre que el
// diseñador dejó para los iconos, no un recorte sobrante. Recortarlo no es reversible.
const ANCHO = 256;
const ALTO = 256;

export interface MarkNeqProps {
  className?: string;
  style?: CSSProperties;
  size?: "default" | "hero";
  "aria-hidden"?: boolean;
}

export function MarkNeq({ className = "", style, size = "default", "aria-hidden": ariaHidden = false }: MarkNeqProps) {
  const baseClass = "mark-neq";
  const sizeClass = size === "hero" ? "hero__neq" : "";

  return (
    <img
      src={neqUrl}
      alt={ariaHidden ? "" : "Diferente"}
      width={ANCHO}
      height={ALTO}
      className={`${baseClass} ${sizeClass} ${className}`.trim()}
      style={style}
      aria-hidden={ariaHidden}
    />
  );
}