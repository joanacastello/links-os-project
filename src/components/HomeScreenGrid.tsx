import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LinkAppIcon from './LinkAppIcon';
import LinkWidget from './LinkWidget';
import { PHONE_INNER_SCREEN_ELEMENT_ID } from './PhoneFrame';
import {
  CSS_DESKTOP_HOME_APP_ROW_HEIGHT,
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
const MOBILE_PROFILE_ROW_HEIGHT = 74;
const MOBILE_APPS_ROW_HEIGHT = 84;
const MOBILE_GRID_GAP = 8;
const MOBILE_APP_ICON_SIZE = 74 * 0.81;
const MOBILE_VIBE_ICON_SIZE = MOBILE_APPS_ROW_HEIGHT + MOBILE_GRID_GAP + MOBILE_APP_ICON_SIZE;

const HOME_LINKS: Record<AppSlotId, string> = {
  newsletter: 'https://www.elbackstage.com/',
  terminal: 'https://terminal.joanacastello.com',
  advent: '#',
  projects: '#',
  github: 'https://github.com/joanacastello',
  soundcloud: 'https://soundcloud.com/joanacastello?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
  edits: 'https://wa.me/34694206233',
};

function ProjectsFolderMiniIcon() {
  return (
    <div className="h-full w-full rounded-[inherit] border border-black/10 bg-[hsla(var(--dock-bg))] p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[20px]">
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[2px] rounded-[17px] bg-white/12 p-[4px]">
        <div className="col-start-1 row-start-1 aspect-square overflow-hidden rounded-[6px]">
          <img
            src="/zero2hero/zero2hero-icon.png"
            alt=""
            width={96}
            height={96}
            decoding="async"
            draggable={false}
            className="size-full aspect-square object-contain object-center"
          />
        </div>
        <div className="col-start-2 row-start-1 aspect-square overflow-hidden rounded-[6px]">
          <img
            src="/onanem/onanem-icon.png"
            alt=""
            width={96}
            height={96}
            decoding="async"
            draggable={false}
            className="size-full aspect-square object-contain object-center"
          />
        </div>
      </div>
    </div>
  );
}

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
    case 'projects':
      return <ProjectsFolderMiniIcon />;
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
    case 'projects':
      return { label: 'Proyectos' };
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

type AppDragPreviewProps = Readonly<{ appId: AppSlotId }>;

/** Vista previa semitransparente (misma forma que el icono flotante). */
function AppDragPreview({ appId }: AppDragPreviewProps) {
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
      <span className="text-[12px] font-medium leading-none text-neutral-800">
        {appMeta(appId).label}
      </span>
    </>
  );
}

type HomeScreenGridProps = Readonly<{
  onOpenAdvent?: () => void;
  onOpenVibe?: () => void;
  onOpenZero2Hero?: () => void;
  onOpenOnAnem?: () => void;
  openProjectsFolderOnMount?: boolean;
  onProjectsFolderOpenHandled?: () => void;
}>;

export default function HomeScreenGrid({
  onOpenAdvent,
  onOpenVibe,
  onOpenZero2Hero,
  onOpenOnAnem,
  openProjectsFolderOnMount = false,
  onProjectsFolderOpenHandled,
}: HomeScreenGridProps) {
  const [positions, setPositions] = useState<Record<AppSlotId, CellPos>>(getInitialPositions);
  const [isProjectsFolderOpen, setIsProjectsFolderOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
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
  const projectsPanelRef = useRef<HTMLDivElement | null>(null);
  const [projectsPortalRoot, setProjectsPortalRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setProjectsPortalRoot(document.getElementById(PHONE_INNER_SCREEN_ELEMENT_ID));
  }, []);

  useEffect(() => {
    const saved = loadSavedPositions();
    if (saved) setPositions(saved);
  }, []);

  useEffect(() => {
    if (!openProjectsFolderOnMount) return;
    setIsProjectsFolderOpen(true);
    onProjectsFolderOpenHandled?.();
  }, [openProjectsFolderOnMount, onProjectsFolderOpenHandled]);

  useEffect(() => {
    const mql = globalThis.matchMedia('(max-width: 767px)');
    const onMediaChange = () => setIsMobileLayout(mql.matches);
    onMediaChange();
    mql.addEventListener('change', onMediaChange);

    return () => {
      mql.removeEventListener('change', onMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isProjectsFolderOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProjectsFolderOpen(false);
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [isProjectsFolderOpen]);

  useEffect(() => {
    if (!isProjectsFolderOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const panel = projectsPanelRef.current;
      if (!panel) return;
      const target = e.target as Node | null;
      if (target && !panel.contains(target)) {
        setIsProjectsFolderOpen(false);
      }
    };
    globalThis.addEventListener('pointerdown', onPointerDown, true);
    return () => globalThis.removeEventListener('pointerdown', onPointerDown, true);
  }, [isProjectsFolderOpen]);

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
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
      globalThis.removeEventListener('pointercancel', onUp);
    };

    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
    globalThis.addEventListener('pointercancel', onUp);

    return () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
      globalThis.removeEventListener('pointercancel', onUp);
    };
  }, [draggingId, endDrag, resolveDropCell]);

  const makePointerHandlers = useCallback(
    (appId: AppSlotId) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let startX = 0;
      let startY = 0;
      let activePointerId: number | null = null;

      const cleanupWindow = (move: (e: PointerEvent) => void, up: (e: PointerEvent) => void) => {
        globalThis.removeEventListener('pointermove', move);
        globalThis.removeEventListener('pointerup', up);
        globalThis.removeEventListener('pointercancel', up);
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

        globalThis.addEventListener('pointermove', onEarlyMove);
        globalThis.addEventListener('pointerup', onEarlyUp);
        globalThis.addEventListener('pointercancel', onEarlyUp);

        timer = setTimeout(() => {
          timer = null;
          cleanupWindow(onEarlyMove, onEarlyUp);
          setIsProjectsFolderOpen(false);
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
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <div className="h-full w-full">
      <div
        className="grid h-full min-h-0 grid-cols-4 gap-2.5 max-md:gap-2 md:gap-[15px]"
        style={
          isMobileLayout
            ? {
                gridTemplateRows: `${MOBILE_PROFILE_ROW_HEIGHT}px ${MOBILE_PROFILE_ROW_HEIGHT}px repeat(4, ${MOBILE_APPS_ROW_HEIGHT}px)`,
              }
            : ({
                gridTemplateRows: `minmax(0, 1fr) minmax(0, 1fr) ${CSS_DESKTOP_HOME_APP_ROW_HEIGHT} ${CSS_DESKTOP_HOME_APP_ROW_HEIGHT} minmax(0, 1fr) minmax(0, 1fr)`,
                ['--desktop-app-row-height' as string]: CSS_DESKTOP_HOME_APP_ROW_HEIGHT,
                ['--desktop-vibe-square-max' as string]:
                  'min(100%, calc(2 * var(--desktop-app-row-height) + 15px))',
              } as CSSProperties)
        }
      >
        <LinkWidget
          variant="profile"
          caption="Sobre Mi"
          className="col-span-4 row-span-2 h-full min-h-0 max-md:max-h-[82%] max-md:self-start md:max-h-[90%] md:self-end"
          profileImage="/foto-joana.png"
          firstName="Joana"
          lastName="Castelló"
        />

        <LinkWidget
          caption="Aprende Vibe Coding"
          onInternalNavigate={onOpenVibe}
          aria-label="Aprende Vibe Coding"
          className="col-start-3 row-start-3 col-span-2 row-span-2 h-full min-h-0"
          iconSizeMobilePx={MOBILE_VIBE_ICON_SIZE}
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
              className="relative flex h-full min-h-0 min-w-0 items-start justify-center md:items-end"
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
                      if (wasSkipping) return;

                      if (occupant === 'projects') {
                        e.preventDefault();
                        setIsProjectsFolderOpen((prev) => !prev);
                        return;
                      }

                      if (isProjectsFolderOpen) {
                        setIsProjectsFolderOpen(false);
                      }

                      if (
                        occupant === 'advent' &&
                        onOpenAdvent
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
      </div>

      {isProjectsFolderOpen && projectsPortalRoot
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="projects-folder-title"
              className="pointer-events-auto absolute inset-0 z-[120] flex items-center justify-center rounded-[34px] border-0 bg-black/25 p-0 backdrop-blur-[24px] transition-opacity duration-220 [-webkit-backdrop-filter:blur(24px)]"
            >
              <div
                className="flex w-full max-w-[320px] flex-col items-center px-2 transition-transform duration-220 translate-y-0 scale-100"
                ref={projectsPanelRef}
              >
                <p
                  id="projects-folder-title"
                  className="mb-5 w-full text-left text-[30px] font-bold text-neutral-800"
                >
                  Proyectos
                </p>
                <div className="dock-glass h-[min(320px,calc(100vw-2rem))] w-[min(320px,calc(100vw-2rem))] rounded-[30px] border border-white/40 shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-[24px]">
                  <div className="grid h-full w-full place-items-center px-4 pb-3 pt-1">
                    <div className="grid h-[292px] w-[256px] grid-cols-3 grid-rows-3 place-items-center gap-x-3 gap-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProjectsFolderOpen(false);
                          onOpenZero2Hero?.();
                        }}
                        className="flex h-[82px] w-[72px] flex-col items-center justify-start gap-1 rounded-xl p-1.5 transition-colors hover:bg-white/10"
                      >
                        <div className="h-[56px] w-[56px] shrink-0 aspect-square overflow-hidden rounded-[13px] shadow-[0_6px_14px_rgba(0,0,0,0.2)]">
                          <img
                            src="/zero2hero/zero2hero-icon.png"
                            alt=""
                            width={128}
                            height={128}
                            decoding="async"
                            draggable={false}
                            className="size-full aspect-square object-contain object-center"
                          />
                        </div>
                        <span className="text-[10px] font-medium leading-none text-neutral-800">Zero2Hero</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProjectsFolderOpen(false);
                          onOpenOnAnem?.();
                        }}
                        className="flex h-[82px] w-[72px] flex-col items-center justify-start gap-1 rounded-xl p-1.5 transition-colors hover:bg-white/10"
                      >
                        <div className="h-[56px] w-[56px] shrink-0 aspect-square overflow-hidden rounded-[13px] shadow-[0_6px_14px_rgba(0,0,0,0.2)]">
                          <img
                            src="/onanem/onanem-icon.png"
                            alt=""
                            width={128}
                            height={128}
                            decoding="async"
                            draggable={false}
                            className="size-full aspect-square object-contain object-center"
                          />
                        </div>
                        <span className="text-[10px] font-medium leading-none text-neutral-800">On Anem</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            projectsPortalRoot,
          )
        : null}

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
    </div>
  );
}
