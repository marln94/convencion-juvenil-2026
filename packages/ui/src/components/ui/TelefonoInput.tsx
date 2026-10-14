import { formatearTelefono } from "@convencion/shared-types";

import { Input, type InputProps } from "./Input";

export type TelefonoInputProps = Omit<InputProps, "type">;

/**
 * Campo de teléfono: acepta dígitos o `dddd-dddd` y los muestra siempre como
 * `dddd-dddd` mientras se escribe. No valida; la validación (si aplica) la hace
 * el formulario con `esTelefono`/`normalizarTelefono` de `@convencion/shared-types`.
 */
export const TelefonoInput = ({ value, onChange, ...rest }: TelefonoInputProps) => (
  <Input
    {...rest}
    type="tel"
    inputMode="tel"
    autoComplete="tel"
    placeholder="8877-9955"
    value={value ? formatearTelefono(value) : value}
    onChange={(valor) => onChange?.(formatearTelefono(valor))}
  />
);

TelefonoInput.displayName = "TelefonoInput";
