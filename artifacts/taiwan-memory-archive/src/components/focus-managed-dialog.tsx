import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

type FocusManagedDialogProps = {
  labelledBy: string;
  className: string;
  children: ReactNode;
  returnFocusFallback?: () => HTMLElement | null;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(dialog: HTMLDivElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getClientRects().length > 0);
}

export function FocusManagedDialog({
  labelledBy,
  className,
  children,
  returnFocusFallback,
}: FocusManagedDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const firstFocusable = getFocusableElements(dialog)[0];
    (firstFocusable ?? dialog).focus();

    return () => {
      window.requestAnimationFrame(() => {
        if (previouslyFocused?.isConnected) {
          previouslyFocused.focus();
          return;
        }
        returnFocusFallback?.()?.focus();
      });
    };
  }, [returnFocusFallback]);

  const keepFocusInDialog = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = getFocusableElements(dialog);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements.at(-1);
    const focusIsOutsideDialog = !dialog.contains(document.activeElement);

    if (!firstFocusable || !lastFocusable) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && (document.activeElement === firstFocusable || focusIsOutsideDialog)) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && (document.activeElement === lastFocusable || focusIsOutsideDialog)) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  return (
    <div
      ref={dialogRef}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={keepFocusInDialog}
    >
      {children}
    </div>
  );
}
