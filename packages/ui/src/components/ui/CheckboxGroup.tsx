import type { HTMLAttributes } from "react";

export interface CheckboxOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  label: string;
  required?: boolean;
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function CheckboxGroup({ label, required, options, value, onChange, error, className = "", ...props }: CheckboxGroupProps) {
  const toggle = (val: string) => {
    const newValue = value.includes(val)
      ? value.filter((v) => v !== val)
      : [...value, val];
    onChange(newValue);
  };

  return (
    <fieldset className={`checkbox-group ${className}`.trim()} {...props}>
      <legend className="label">
        {label}
        {required && <span className="text-red" aria-hidden="true"> *</span>}
      </legend>
      <div className="checkbox-group__items" style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {options.map((option) => (
          <label key={option.value} className="checkbox-group__item">
            <input
              type="checkbox"
              className="checkbox-group__input"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              value={option.value}
            />
            <span className="checkbox-group__label">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <span className="error-message" role="alert">{error}</span>}
    </fieldset>
  );
}