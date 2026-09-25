import type { InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  error?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const Input = (props: InputProps) => {
  const { label, error, required, className = "", id, value, onChange, ...rest } = props;
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className="input-wrapper">
      <label htmlFor={inputId} className="label">
        {label}
        {required && <span className="text-red" aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={handleChange}
        className={`input ${error ? "input--error" : ""} ${className}`.trim()}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

Input.displayName = "Input";