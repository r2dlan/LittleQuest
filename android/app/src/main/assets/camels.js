const atlas = typeof Image === "undefined" ? null : new Image();
if (atlas) atlas.src = new URL("./assets/camels.png", import.meta.url).href;

export function drawCamel(
  ctx,
  { x, y, facing = 1, time = 0, walking = true },
  image = atlas,
) {
  if (!image?.complete || !image.naturalWidth) return;
  const frame = walking && Math.sin(time * 5) > 0 ? 1 : 0;
  const [sx, sy, sw, sh] = frame ? [305, 647, 703, 566] : [309, 46, 699, 581];
  const width = 94;
  const height = Math.round((sh / sw) * width);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height + 3, width, height);
  ctx.restore();
}
