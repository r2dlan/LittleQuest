/** Screen coordinates: right and down are positive; small thumb jitter is ignored. */
export function swipeDirection(startX, startY, x, y) {
  const dx = x - startX,
    dy = y - startY,
    length = Math.hypot(dx, dy);
  return length < 10 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
}
