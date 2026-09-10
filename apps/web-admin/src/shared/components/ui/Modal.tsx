import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Minimal accessible dialog: labelled, Escape-dismissable, and it moves
 * focus into the panel on open so keyboard users are not left behind on the
 * page underneath.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus is moved ONLY when the dialog opens. This effect must not depend
  // on `onClose`: callers pass an inline handler whose identity changes on
  // every render, so including it re-ran this on every keystroke and yanked
  // focus from the field back to the panel — making it impossible to type
  // more than one character into any admin form.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-marine-950/70 p-4 sm:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="card w-full max-w-lg p-5 outline-none"
      >
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
        {children}
      </div>
    </div>
  );
}
