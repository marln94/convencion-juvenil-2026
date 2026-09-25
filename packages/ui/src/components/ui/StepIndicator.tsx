import type { ReactNode } from "react";

export interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
  children?: ReactNode;
}

export function StepIndicator({ current, total, labels, children }: StepIndicatorProps) {
  const progressPercent = ((current - 1) / Math.max(1, total - 1)) * 100;

  return (
    <div className="step-indicator" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div className="step-indicator__track">
        <div className="step-indicator__progress" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="step-indicator__steps">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isActive = step === current;
          const isCompleted = step < current;
          return (
            <div
              key={step}
              className={`step-indicator__step ${isActive ? "step-indicator__step--active" : ""} ${isCompleted ? "step-indicator__step--completed" : ""}`}
            >
              <span className="step-indicator__circle">
                {step}
              </span>
              {labels?.[i] && <span className="step-indicator__label">{labels[i]}</span>}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}