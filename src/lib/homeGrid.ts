export const GRID_ROWS = 6;
export const GRID_COLS = 4;

export type AppSlotId =
  | 'newsletter'
  | 'terminal'
  | 'advent'
  | 'projects'
  | 'github'
  | 'soundcloud'
  | 'edits';

export type CellPos = { row: number; col: number };

export function posKey(p: CellPos): string {
  return `${p.row},${p.col}`;
}

/** Celdas donde pueden vivir apps (0-based). Filas 1–2 = perfil; (fila 3–4, col 3–4) = widget SA. */
export function isAppCellAllowed(row: number, col: number): boolean {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
  if (row < 2) return false;
  if (row <= 3 && col >= 2) return false;
  return true;
}

export function listAllowedCells(): CellPos[] {
  const out: CellPos[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (isAppCellAllowed(row, col)) out.push({ row, col });
    }
  }
  return out;
}

export function getInitialPositions(): Record<AppSlotId, CellPos> {
  return {
    newsletter: { row: 2, col: 0 },
    terminal: { row: 2, col: 1 },
    advent: { row: 3, col: 0 },
    projects: { row: 3, col: 1 },
    edits: { row: 4, col: 0 },
    github: { row: 4, col: 2 },
    soundcloud: { row: 4, col: 3 },
  };
}

function isSamePos(a: CellPos, b: CellPos): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Layout por defecto anterior (antes del ajuste visual pedido).
 * Si detectamos exactamente este patrón, lo migramos al nuevo default.
 */
function isLegacyDefaultLayout(positions: Record<AppSlotId, CellPos>): boolean {
  return (
    isSamePos(positions.newsletter, { row: 2, col: 0 }) &&
    isSamePos(positions.terminal, { row: 2, col: 1 }) &&
    isSamePos(positions.advent, { row: 3, col: 0 }) &&
    isSamePos(positions.projects, { row: 3, col: 1 }) &&
    isSamePos(positions.github, { row: 4, col: 0 }) &&
    isSamePos(positions.soundcloud, { row: 4, col: 1 }) &&
    isSamePos(positions.edits, { row: 5, col: 0 })
  );
}

function buildOccupancy(
  positions: Record<AppSlotId, CellPos>,
  excludeId?: AppSlotId,
): Map<string, AppSlotId> {
  const m = new Map<string, AppSlotId>();
  for (const id of Object.keys(positions) as AppSlotId[]) {
    if (id === excludeId) continue;
    const p = positions[id];
    m.set(posKey(p), id);
  }
  return m;
}

const NEIGHBORS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Primera celda vacía por BFS desde `seeds` (p. ej. vecinos del destino). */
function findNearestEmptyCell(
  occupied: Map<string, AppSlotId>,
  seeds: CellPos[],
): CellPos | null {
  const visited = new Set<string>();
  const queue: CellPos[] = [];

  for (const s of seeds) {
    if (!isAppCellAllowed(s.row, s.col)) continue;
    const k = posKey(s);
    if (visited.has(k)) continue;
    visited.add(k);
    queue.push(s);
  }

  while (queue.length > 0) {
    const p = queue.shift()!;
    const k = posKey(p);
    if (!occupied.has(k)) return p;

    for (const [dr, dc] of NEIGHBORS) {
      const nr = p.row + dr;
      const nc = p.col + dc;
      if (!isAppCellAllowed(nr, nc)) continue;
      const nk = posKey({ row: nr, col: nc });
      if (visited.has(nk)) continue;
      visited.add(nk);
      queue.push({ row: nr, col: nc });
    }
  }
  return null;
}

function neighborSeeds(target: CellPos): CellPos[] {
  return NEIGHBORS.map(([dr, dc]) => ({ row: target.row + dr, col: target.col + dc })).filter((p) =>
    isAppCellAllowed(p.row, p.col),
  );
}

/**
 * Coloca `appId` en `target`. Si estaba ocupado, desplaza la otra app a la celda libre más cercana (BFS desde vecinos del destino).
 */
export function tryMoveApp(
  positions: Record<AppSlotId, CellPos>,
  appId: AppSlotId,
  target: CellPos,
): Record<AppSlotId, CellPos> | null {
  if (!isAppCellAllowed(target.row, target.col)) return null;

  const current = positions[appId];
  if (current.row === target.row && current.col === target.col) return positions;

  const next: Record<AppSlotId, CellPos> = { ...positions };
  const occ = buildOccupancy(positions, appId);
  const targetKey = posKey(target);
  const occupant = occ.get(targetKey);

  next[appId] = target;
  occ.delete(posKey(current));
  occ.set(targetKey, appId);

  if (!occupant) return next;

  const seeds = neighborSeeds(target);
  const free = findNearestEmptyCell(occ, seeds);
  if (!free) return null;

  next[occupant] = free;
  occ.set(posKey(free), occupant);

  return next;
}

export function positionsAreValid(positions: Record<AppSlotId, CellPos>): boolean {
  const ids = Object.keys(positions) as AppSlotId[];
  if (ids.length !== 7) return false;
  const seen = new Set<string>();
  for (const id of ids) {
    const p = positions[id];
    if (!p || !isAppCellAllowed(p.row, p.col)) return false;
    const k = posKey(p);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}

const STORAGE_KEY = 'links-os-home-app-positions';

export function loadSavedPositions(): Record<AppSlotId, CellPos> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<AppSlotId, CellPos>;
    if (!positionsAreValid(parsed)) return null;
    if (isLegacyDefaultLayout(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePositions(positions: Record<AppSlotId, CellPos>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* ignore */
  }
}
