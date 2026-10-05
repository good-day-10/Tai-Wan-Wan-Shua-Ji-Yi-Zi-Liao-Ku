export type DragSnapshot = {
  startX: number;
  startY: number;
  x: number;
  y: number;
};

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