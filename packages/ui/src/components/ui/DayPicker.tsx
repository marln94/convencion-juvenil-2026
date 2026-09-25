import type { HTMLAttributes } from "react";

export interface DayOption {
  value: string;
  label: string;
  number: number;
  dayName: string;
  dateTime?: string;
}

export interface DayPickerProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  label: string;
  required?: boolean;
  days: DayOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function DayPicker({ label, required, days, value, onChange, error, className = "", id, ...props }: DayPickerProps) {
  const baseId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const errorId = `${baseId}-error`;

  const toggle = (dayValue: string) => {
    const newValue = value.includes(dayValue)
      ? value.filter((current) => current !== dayValue)
      : [...value, dayValue];
    onChange(newValue);
  };

  return (
    <fieldset
      {...props}
      id={id}
      className={`day-picker ${className}`.trim()}
      aria-describedby={error ? errorId : undefined}
      aria-required={required ? true : undefined}
    >
      <legend className="label">
        {label}
        {required && <span className="text-red" aria-hidden="true"> *</span>}
      </legend>
      <div className="day-picker__grid">
        {days.map((day) => {
          const inputId = `${baseId}-${day.value}`;

          return (
            <label key={day.value} htmlFor={inputId} className="day-picker__day">
              <input
                id={inputId}
                type="checkbox"
                className="day-picker__input sr-only"
                checked={value.includes(day.value)}
                onChange={() => toggle(day.value)}
                value={day.value}
                aria-label={day.label}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
              <span className="day-picker__number">
                {day.dateTime ? <time dateTime={day.dateTime}>{day.number}</time> : day.number}
              </span>
              <span className="day-picker__name">{day.dayName}</span>
            </label>
          );
        })}
      </div>
      {error && <span id={errorId} className="error-message" role="alert">{error}</span>}
    </fieldset>
  );
}
