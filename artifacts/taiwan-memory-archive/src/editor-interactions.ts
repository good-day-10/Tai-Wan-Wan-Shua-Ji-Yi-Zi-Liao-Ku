export type DragSnapshot = {
  startX: number;
  startY: number;
  x: number;
  y: number;
};

export function hasEditorSessionChanged(
  originalSessionId: string | null,
  currentSessionId: string | null,
  isSignedIn: boolean,
): boolean {
  return !isSignedIn || !currentSessionId || originalSessionId !== currentSessionId;
}

export function hasArchiveDraftChanges(archive: unknown, draft: unknown): boolean {
  return JSON.stringify(draft) !== JSON.stringify(archive);
}

export function getDraggedPosition(
  drag: DragSnapshot,
  clientX: number,
  clientY: number,
): Pick<DragSnapshot, 'x' | 'y'> {
  return {
    x: Math.round(drag.x + clientX - drag.startX),
    y: Math.round(drag.y + clientY - drag.startY),
  };
}