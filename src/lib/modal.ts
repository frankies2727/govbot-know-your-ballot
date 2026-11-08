import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * What a modal (a dialog, a drawer) owes the keyboard: focus moves into it
 * when it opens (`initial`, else the modal itself) and back to where it was
 * when it closes; Tab and Shift+Tab stay inside; Escape closes it; and the
 * page behind doesn't scroll. `onClose` may change on every render without
 * re-running any of this.
 */
export function useModal(root: RefObject<HTMLElement | null>, active: boolean, onClose: () => void, initial?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const before = document.activeElement as HTMLElement | null;
    (initial?.current ?? root.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close.current(); return; }
      if (e.key !== 'Tab' || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || !root.current.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !root.current.contains(at))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus({ preventScroll: true });
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}
