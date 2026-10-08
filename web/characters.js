// Original sprite artwork generated from the approved B design.
const frames = {
  hero: {
    down: [122, 40, 238, 382],
    right: [516, 39, 224, 388],
    up: [903, 40, 224, 384],
  },
  jona: {
    down: [114, 455, 244, 345],
    right: [521, 455, 194, 351],
    up: [894, 455, 240, 350],
  },
  mina: {
    down: [141, 813, 200, 408],
    right: [526, 814, 214, 407],
    up: [911, 813, 200, 408],
  },
};
const atlas = typeof Image === "undefined" ? null : new Image();
if (atlas)
  atlas.src = new URL("./assets/characters-b.png", import.meta.url).href;

export function characterFrame(role = "hero", face = "down") {
  const palette = frames[role] ?? frames.mina;
  const direction = face === "left" ? "right" : face;
  const [x, y, width, height] = palette[direction] ?? palette.down;
  return { x, y, width, height, mirrored: face === "left" };
}

export function drawCharacter(
  ctx,
  { x, y, face = "down", role = "hero", walking = false, time = 0 },
  image = atlas,
) {
  if (!image?.complete || !image.naturalWidth) return;
  const frame = characterFrame(role, face);
  const width = Math.round(frame.width * 0.15);
  const height = Math.round(frame.height * 0.15);
  const stride = walking ? Math.round(Math.sin(time * 12) * 2) : 0;
  const bob = walking ? Math.abs(stride) % 2 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - bob));
  if (frame.mirrored) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  if (!walking) {
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -Math.floor(width / 2),
      3 - height,
      width,
      height,
    );
  } else {
    // Animate the feet independently while keeping the face and torso stable.
    const upperSource = Math.floor(frame.height * 0.78);
    const upperHeight = Math.round(height * 0.78);
    const halfSource = Math.floor(frame.width / 2);
    const halfWidth = Math.floor(width / 2);
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      upperSource,
      -halfWidth,
      3 - height,
      width,
      upperHeight,
    );
    for (let i = 0; i < 2; i++) {
      ctx.drawImage(
        image,
        frame.x + i * halfSource,
        frame.y + upperSource,
        i ? frame.width - halfSource : halfSource,
        frame.height - upperSource,
        i ? 0 : -halfWidth,
        3 - height + upperHeight - Math.max(0, i ? -stride : stride),
        i ? width - halfWidth : halfWidth,
        height - upperHeight,
      );
    }
  }
  ctx.restore();
}
