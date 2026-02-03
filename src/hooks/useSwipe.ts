import { useMemo, useRef } from 'react';

type UseSwipeOptions = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number;
  maxDuration?: number;
};

const isInteractiveElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (['button', 'a', 'input', 'select', 'textarea', 'label'].includes(tag)) return true;
  return target.closest('button, a, input, select, textarea, label') !== null;
};

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 40,
  maxDuration = 600,
}: UseSwipeOptions) => {
  const startRef = useRef<{ x: number; y: number; t: number; id: number }>();

  const bind = useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return; // ignore right/middle click
        if (isInteractiveElement(e.target)) return;
        startRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
      },
      onPointerUp: (e: React.PointerEvent) => {
        const start = startRef.current;
        if (!start || start.id !== e.pointerId) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const dt = Date.now() - start.t;
        startRef.current = undefined;

        if (dt > maxDuration) return;
        if (Math.abs(dx) < minDistance) return;
        if (Math.abs(dx) <= Math.abs(dy)) return;

        if (dx < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      },
      onPointerCancel: () => {
        startRef.current = undefined;
      },
    }),
    [maxDuration, minDistance, onSwipeLeft, onSwipeRight],
  );

  return {
    bind,
    touchAction: 'pan-y' as const,
  };
};

export default useSwipe;
