import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

/**
 * Labelled text input. The label is bound via a generated id, and the error
 * is wired through aria-describedby + aria-invalid so screen readers
 * announce validation failures rather than only showing them visually.
 */
export function TextField({
  label,
  error,
  hint,
  className = '',
  ...rest
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className = '',
  children,
  ...rest
}: BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        {children}
      </select>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
