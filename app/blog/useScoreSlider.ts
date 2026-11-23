import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type UIEvent,
} from 'react';

type MouseDrag = {
  pointerId: number;
  x: number;
  y: number;
  startLeft: number;
  active: boolean;
};

export default function useScoreSlider(pageCount: number, resetKey: string) {
  const viewportRef = useRef<HTMLElement>(null);
  const drag = useRef<MouseDrag | null>(null);
  const ignoreClick = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    setCurrentPage(0);
    viewport?.scrollTo({ left: 0, behavior: 'instant' });

    return () => {
      const previousDrag = drag.current;
      drag.current = null;
      ignoreClick.current = false;
      viewport?.removeAttribute('data-dragging');
      if (previousDrag && viewport?.hasPointerCapture(previousDrag.pointerId)) {
        viewport.releasePointerCapture(previousDrag.pointerId);
      }
    };
  }, [resetKey]);

  function boundPage(page: number) {
    return Math.max(0, Math.min(pageCount - 1, page));
  }

  function nearestPage(viewport: HTMLElement, left = viewport.scrollLeft) {
    return boundPage(Math.round(left / Math.max(1, viewport.clientWidth)));
  }

  function scrollToPage(viewport: HTMLElement, page: number) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({
      left: boundPage(page) * viewport.clientWidth,
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  }

  function finishDrag(viewport: HTMLElement, pointerId: number, cancelled: boolean) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== pointerId) return;
    drag.current = null;
    if (!gesture.active) return;

    ignoreClick.current = true;
    const distance = viewport.scrollLeft - gesture.startLeft;
    const startPage = nearestPage(viewport, gesture.startLeft);
    let destination = nearestPage(viewport);
    if (!cancelled && destination === startPage && Math.abs(distance) >= 45) {
      destination = startPage + Math.sign(distance);
    }
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    viewport.removeAttribute('data-dragging');
    scrollToPage(viewport, destination);
  }

  const sliderProps = {
    onScroll(event: UIEvent<HTMLElement>) {
      setCurrentPage(nearestPage(event.currentTarget));
    },
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (pageCount <= 1 || event.target !== event.currentTarget) return;
      const viewport = event.currentTarget;
      let destination = nearestPage(viewport);
      switch (event.key) {
        case 'ArrowLeft': destination -= 1; break;
        case 'ArrowRight': destination += 1; break;
        case 'Home': destination = 0; break;
        case 'End': destination = pageCount - 1; break;
        default: return;
      }
      event.preventDefault();
      scrollToPage(viewport, destination);
    },
    onPointerDown(event: PointerEvent<HTMLElement>) {
      ignoreClick.current = false;
      if (pageCount <= 1 || event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0) return;
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startLeft: event.currentTarget.scrollLeft,
        active: false,
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const gesture = drag.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const viewport = event.currentTarget;
      if (!(event.buttons & 1)) {
        finishDrag(viewport, event.pointerId, true);
        return;
      }
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.active) {
        if (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy)) return;
        viewport.setPointerCapture(event.pointerId);
        viewport.setAttribute('data-dragging', '');
        gesture.active = true;
      }
      event.preventDefault();
      viewport.scrollTo({ left: gesture.startLeft - dx, behavior: 'instant' });
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      finishDrag(event.currentTarget, event.pointerId, false);
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      finishDrag(event.currentTarget, event.pointerId, true);
    },
    onLostPointerCapture(event: PointerEvent<HTMLElement>) {
      finishDrag(event.currentTarget, event.pointerId, true);
    },
    onPointerLeave(event: PointerEvent<HTMLElement>) {
      if (!drag.current?.active) finishDrag(event.currentTarget, event.pointerId, true);
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!ignoreClick.current || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      ignoreClick.current = false;
    },
  };

  return { viewportRef, currentPage: boundPage(currentPage), sliderProps };
}
