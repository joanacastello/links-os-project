import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import LinkAppIcon from './LinkAppIcon';
import LinkWidget from './LinkWidget';
import {
  getInitialPositions,
  listAllowedCells,
  loadSavedPositions,
  posKey,
  savePositions,
  tryMoveApp,
  type AppSlotId,
  type CellPos,
} from '../lib/homeGrid';

const LONG_PRESS_MS = 1000;
const MOVE_CANCEL_PX = 14;

const HOME_LINKS: Record<AppSlotId, string> = {
  newsletter: 'https://example.com/newsletter',
  terminal: 'https://terminal.joanacastello.com',
  advent: '#',
  github: 'https://github.com/joanacastello',
  soundcloud: 'https://soundcloud.com/joanacastello/tracks',
  edits: 'https://wa.me/34694206233',
};

function appIconFor(id: AppSlotId): ReactNode {
  switch (id) {
    case 'newsletter':
      return (
        <img src="/app-icons/gmail.png" alt="" width={74} height={74} draggable={false} />
      );
    case 'terminal':
      return (
        <img src="/app-icons/terminal.png" alt="" width={74} height={74} draggable={false} />
      );
    case 'advent':
      return (
        <img src="/app-icons/adviento.png" alt="" width={74} height={74} draggable={false} />
      );
    case 'github':
      return <img src="/app-icons/github.png" alt="" width={74} height={74} draggable={false} />;
    case 'soundcloud':
      return (
        <img src="/app-icons/soundcloud.png" alt="" width={74} height={74} draggable={false} />
      );
    case 'edits':
      return (
        <img src="/app-icons/whatsapp.png" alt="" width={74} height={74} draggable={false} />
      );
    default:
      return null;
  }
}

function appMeta(id: AppSlotId): { label: string; bare?: boolean } {
  switch (id) {
    case 'newsletter':
      return { label: 'Newsletter' };
    case 'terminal':
      return { label: 'Terminal' };
    case 'advent':
      return { label: 'Adviento' };
    case 'github':
      return { label: 'Github', bare: true };
    case 'soundcloud':
      return { label: 'SoundCloud' };
    case 'edits':
      return { label: 'Whatsapp' };
    default:
      return { label: '' };
  }
}

/** Vista previa semitransparente (misma forma que el icono flotante). */
function AppDragPreview({ appId }: { appId: AppSlotId }) {
  const bare = appMeta(appId).bare;
  return (
    <>
      <div
        className={
          bare
            ? 'flex h-[calc(74px*0.81)] w-[calc(74px*0.81)] shrink-0 items-center justify-center overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover'
            : 'flex h-[calc(74px*0.81)] w-[calc(74px*0.81)] shrink-0 items-center justify-center overflow-hidden rounded-[calc(20px*0.81)] bg-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.22)] [&_svg]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover'
        }
      >
        {appIconFor(appId)}
      </div>
      <span className="text-[12px] font-medium leading-none text-white drop-shadow-md">
        {appMeta(appId).label}
      </span>
    </>
  );
}

interface HomeScreenGridProps {
  onOpenAdvent?: () => void;
  onOpenVibe?: () => void;
}

export default function HomeScreenGrid({ onOpenAdvent, onOpenVibe }: HomeScreenGridProps) {
  const [positions, setPositions] = useState<Record<AppSlotId, CellPos>>(getInitialPositions);
  const [draggingId, setDraggingId] = useState<AppSlotId | null>(null);
  const [previewCell, setPreviewCell] = useState<CellPos | null>(null);
  const [previewAnchor, setPreviewAnchor] = useState<{ x: number; y: number } | null>(null);
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const dragPointerIdRef = useRef<number | null>(null);
  const dragSourceElRef = useRef<HTMLElement | null>(null);
  const dragOriginRef = useRef<CellPos | null>(null);
  const skipClickRef = useRef(false);
  const slotElementsRef = useRef<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    const saved = loadSavedPositions();
    if (saved) setPositions(saved);
  }, []);

  useLayoutEffect(() => {
    if (!draggingId || !previewCell) {
      setPreviewAnchor(null);
      return;
    }
    const el = slotElementsRef.current.get(posKey(previewCell));
    if (!el) {
      setPreviewAnchor(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setPreviewAnchor({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    });
  }, [draggingId, previewCell]);

  const appByCell = useMemo(() => {
    const m = new Map<string, AppSlotId>();
    for (const id of Object.keys(positions) as AppSlotId[]) {
      m.set(posKey(positions[id]), id);
    }
    return m;
  }, [positions]);

  const registerSlot = useCallback((pos: CellPos, el: HTMLElement | null) => {
    slotElementsRef.current.set(posKey(pos), el);
  }, []);

  const resolveDropCell = useCallback((clientX: number, clientY: number): CellPos | null => {
    for (const [, el] of slotElementsRef.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      ) {
        const row = el.dataset.gridRow;
        const col = el.dataset.gridCol;
        if (row !== undefined && col !== undefined) {
          return { row: Number(row), col: Number(col) };
        }
      }
    }
    return null;
  }, []);

  const endDrag = useCallback(
    (clientX: number, clientY: number, appId: AppSlotId) => {
      const pid = dragPointerIdRef.current;
      const target = resolveDropCell(clientX, clientY);
      if (target) {
        setPositions((prev) => {
          const next = tryMoveApp(prev, appId, target);
          if (next) {
            savePositions(next);
            return next;
          }
          return prev;
        });
      }
      setDraggingId(null);
      setPreviewCell(null);
      dragPointerIdRef.current = null;
      dragOriginRef.current = null;
      try {
        const el = dragSourceElRef.current;
        if (el != null && pid != null) el.releasePointerCapture(pid);
      } catch {
        /* ignore */
      }
      dragSourceElRef.current = null;
      document.body.style.removeProperty('cursor');
    },
    [resolveDropCell],
  );

  useEffect(() => {
    if (!draggingId || dragPointerIdRef.current === null) return;

    const pid = dragPointerIdRef.current;
    const id = draggingId;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      setFloatPos({ x: e.clientX, y: e.clientY });
      const over = resolveDropCell(e.clientX, e.clientY);
      const origin = dragOriginRef.current;
      setPreviewCell(over ?? origin);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      skipClickRef.current = true;
      endDrag(e.clientX, e.clientY, id);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [draggingId, endDrag, resolveDropCell]);

  const makePointerHandlers = useCallback(
    (appId: AppSlotId) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let startX = 0;
      let startY = 0;
      let activePointerId: number | null = null;

      const cleanupWindow = (move: (e: PointerEvent) => void, up: (e: PointerEvent) => void) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };

      const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
        if (e.button !== 0) return;
        startX = e.clientX;
        startY = e.clientY;
        activePointerId = e.pointerId;

        const onEarlyMove = (ev: PointerEvent) => {
          if (ev.pointerId !== activePointerId) return;
          if (
            Math.hypot(ev.clientX - startX, ev.clientY - startY) > MOVE_CANCEL_PX
          ) {
            if (timer !== null) clearTimeout(timer);
            timer = null;
            cleanupWindow(onEarlyMove, onEarlyUp);
          }
        };

        const onEarlyUp = (ev: PointerEvent) => {
          if (ev.pointerId !== activePointerId) return;
          if (timer !== null) clearTimeout(timer);
          timer = null;
          cleanupWindow(onEarlyMove, onEarlyUp);
        };

        window.addEventListener('pointermove', onEarlyMove);
        window.addEventListener('pointerup', onEarlyUp);
        window.addEventListener('pointercancel', onEarlyUp);

        timer = setTimeout(() => {
          timer = null;
          cleanupWindow(onEarlyMove, onEarlyUp);
          const origin = positionsRef.current[appId];
          dragOriginRef.current = origin;
          setPreviewCell(origin);
          dragPointerIdRef.current = e.pointerId;
          dragSourceElRef.current = e.currentTarget;
          setFloatPos({ x: e.clientX, y: e.clientY });
          setDraggingId(appId);
          document.body.style.cursor = 'grabbing';
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }, LONG_PRESS_MS);
      };

      const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (skipClickRef.current) {
          e.preventDefault();
          skipClickRef.current = false;
        }
      };

      return { onPointerDown, onClick };
    },
    [],
  );

  const handlersCache = useRef(
    new Map<AppSlotId, ReturnType<typeof makePointerHandlers>>(),
  );

  const getHandlers = (appId: AppSlotId) => {
    let h = handlersCache.current.get(appId);
    if (!h) {
      h = makePointerHandlers(appId);
      handlersCache.current.set(appId, h);
    }
    return h;
  };

  const allowedCells = listAllowedCells();

  return (
    <>
      <div
        className="grid h-full min-h-0 grid-cols-4 gap-2.5 max-md:gap-2 md:gap-[15px]"
        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
      >
        <LinkWidget
          variant="profile"
          caption="Sobre Mi"
          className="col-span-4 row-span-2 h-full min-h-0 max-md:max-h-[80%] max-md:self-start"
          profileImage="/foto-joana.png"
          firstName="Joana"
          lastName="Castelló"
        />

        <LinkWidget
          caption="Aprende Vibe Coding"
          onInternalNavigate={onOpenVibe}
          aria-label="Aprende Vibe Coding"
          className="col-start-3 row-start-3 col-span-2 row-span-2 h-full min-h-0"
          icon={
            <img
              src="/app-icons/sa-logo.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={800}
              height={800}
              draggable={false}
              decoding="async"
            />
          }
        />
        {allowedCells.map((pos) => {
          const k = posKey(pos);
          const occupant = appByCell.get(k);
          return (
            <div
              key={k}
              ref={(el) => registerSlot(pos, el)}
              data-grid-row={pos.row}
              data-grid-col={pos.col}
              className="relative flex h-full min-h-0 min-w-0 items-center justify-center md:items-end"
              style={{
                gridRowStart: pos.row + 1,
                gridColumnStart: pos.col + 1,
              }}
            >
              {occupant ? (
                <LinkAppIcon
                  label={appMeta(occupant).label}
                  href={HOME_LINKS[occupant]}
                  bare={appMeta(occupant).bare}
                  icon={appIconFor(occupant)}
                  className={
                    draggingId === occupant
                      ? 'pointer-events-none invisible'
                      : ''
                  }
                  anchorProps={{
                    ...getHandlers(occupant),
                    style: { touchAction: 'manipulation' },
                    onClick: (e) => {
                      const wasSkipping = skipClickRef.current;
                      getHandlers(occupant).onClick(e);
                      if (
                        occupant === 'advent' &&
                        onOpenAdvent &&
                        !wasSkipping
                      ) {
                        e.preventDefault();
                        onOpenAdvent();
                      }
                    },
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {draggingId && previewAnchor ? (
        <div
          className="pointer-events-none fixed z-[150] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 opacity-40 [will-change:left,top]"
          style={{
            left: previewAnchor.x,
            top: previewAnchor.y,
            transition:
              'left 220ms cubic-bezier(0.22, 0.99, 0.35, 1), top 220ms cubic-bezier(0.22, 0.99, 0.35, 1)',
          }}
          aria-hidden
        >
          <AppDragPreview appId={draggingId} />
        </div>
      ) : null}

      {draggingId ? (
        <div
          className="pointer-events-none fixed z-[200] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
          style={{ left: floatPos.x, top: floatPos.y }}
          aria-hidden
        >
          <AppDragPreview appId={draggingId} />
        </div>
      ) : null}
    </>
  );
}
