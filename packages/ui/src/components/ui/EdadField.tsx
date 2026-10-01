import type { InputHTMLAttributes } from "react";

import type { RangoEdad } from "@convencion/shared-types";

export type { RangoEdad };

export interface EdadFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  label: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  minimo?: number;
  maximo?: number;
  rangoPermitido?: RangoEdad;
}

const MINIMO_POR_DEFECTO = 15;
const MAXIMO_POR_DEFECTO = 99;

function aEntero(value: string): number | null {
  if (value.trim() === "") return null;
  const numero = Number(value);
  return Number.isFinite(numero) ? Math.trunc(numero) : null;
}

function aFraccion(valor: number, minimo: number, maximo: number): number {
  const span = maximo - minimo;
  if (span <= 0) return 0;
  return (valor - minimo) / span;
}

/**
 * Un valor vacío no es "fuera de rango": la obligatoriedad la reporta el
 * formulario por separado, para no mezclar los dos mensajes.
 */
export function edadEnRango(valor: string, rango: RangoEdad): boolean {
  const entero = aEntero(valor);
  if (entero === null) return true;
  return entero >= rango.min && entero <= rango.max;
}

export function EdadField(props: EdadFieldProps) {
  const {
    label,
    error,
    required,
    className = "",
    id,
    value = "",
    onChange,
    minimo = MINIMO_POR_DEFECTO,
    maximo = MAXIMO_POR_DEFECTO,
    rangoPermitido,
    ...rest
  } = props;

  const baseId = id || label.toLowerCase().replace(/\s+/g, "-");
  const sliderId = `${baseId}-slider`;
  const errorId = `${baseId}-error`;
  const captionId = `${baseId}-caption`;

  const entero = aEntero(value);
  const valorSlider = entero === null ? minimo : Math.min(Math.max(entero, minimo), maximo);

  const descripciones = [rangoPermitido ? captionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  // El track del range nativo reserva media unidad de thumb en cada extremo,
  // asi que las fracciones se calculan sobre el ancho util, no sobre el 100%.
  const estiloBanda = rangoPermitido
    ? ({
        "--banda-inicio": aFraccion(rangoPermitido.min, minimo, maximo).toFixed(6),
        "--banda-fin": aFraccion(rangoPermitido.max, minimo, maximo).toFixed(6),
      } as React.CSSProperties)
    : undefined;

  return (
    <div className={`input-wrapper edad-field ${className}`.trim()}>
      <label htmlFor={baseId} className="label">
        {label}
        {required && <span className="text-red" aria-hidden="true"> *</span>}
      </label>
      <input
        id={baseId}
        type="number"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        min={minimo}
        max={maximo}
        step={1}
        inputMode="numeric"
        className={`input ${error ? "input--error" : ""}`.trim()}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={descripciones || undefined}
        {...rest}
      />
      {rangoPermitido && (
        <>
          <label htmlFor={sliderId} className="sr-only">
            {`${label} (control deslizante)`}
          </label>
          <div className="edad-field__track" style={estiloBanda}>
            <span className="edad-field__band" aria-hidden="true" />
            <input
              id={sliderId}
              type="range"
              className="edad-field__slider"
              min={minimo}
              max={maximo}
              step={1}
              value={valorSlider}
              onChange={(event) => onChange?.(event.target.value)}
              aria-describedby={descripciones || undefined}
            />
          </div>
          <p id={captionId} className="edad-field__hint">
            Rango permitido: {rangoPermitido.min} a {rangoPermitido.max} años
          </p>
        </>
      )}
      {error && (
        <span id={errorId} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

EdadField.displayName = "EdadField";
