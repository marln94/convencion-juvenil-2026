import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  label: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: readonly [string, string][];
  value?: string;
  onChange?: (value: string) => void;
}

export const Select = (props: SelectProps) => {
  const { label, error, required, placeholder, options, className = "", id, value, onChange, ...rest } = props;
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className="input-wrapper">
      <label htmlFor={selectId} className="label">
        {label}
        {required && <span className="text-red" aria-hidden="true"> *</span>}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={handleChange}
        className={`select ${error ? "input--error" : ""} ${className}`.trim()}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...rest}
      >
        <option value="">{placeholder ?? "Seleccioná una opción"}</option>
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${selectId}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

Select.displayName = "Select";