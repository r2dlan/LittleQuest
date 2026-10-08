const atlas = typeof Image === "undefined" ? null : new Image();
if (atlas) atlas.src = new URL("./assets/wildlife.png", import.meta.url).href;
const animals = {
  rabbit: {
    width: 26,
    frames: [
      [318, 24, 262, 253],
      [875, 24, 270, 253],
    ],
  },
  fox: {
    width: 48,
    frames: [
      [170, 279, 480, 290],
      [730, 279, 485, 290],
    ],
  },
  hedgehog: {
    width: 25,
    frames: [
      [318, 580, 268, 178],
      [870, 580, 266, 178],
    ],
  },
  deer: {
    width: 48,
    frames: [
      [318, 754, 340, 375],
      [845, 754, 355, 375],
    ],
  },
};
export function drawWildlife(
  ctx,
  { kind, x, y, facing = 1, time = 0, walking = true },
  image = atlas,
) {
  const animal = animals[kind];
  if (!animal || !image?.complete || !image.naturalWidth) return;
  const frame =
    walking && Math.sin(time * (kind === "hedgehog" ? 4 : 7)) > 0 ? 1 : 0;
  const [sx, sy, sw, sh] = animal.frames[frame];
  const height = Math.round((sh / sw) * animal.width);
  const hop =
    kind === "rabbit" && walking
      ? Math.round(Math.abs(Math.sin(time * 5)) * 3)
      : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - hop));
  ctx.scale(facing, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    -Math.round(animal.width / 2),
    -height + 3,
    animal.width,
    height,
  );
  ctx.restore();
}
