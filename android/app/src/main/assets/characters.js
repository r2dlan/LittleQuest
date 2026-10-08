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
  desertMan: {
    down: [90, 55, 280, 558],
    right: [491, 55, 265, 558],
    up: [890, 55, 280, 558],
  },
  desertWoman: {
    down: [98, 655, 275, 562],
    right: [496, 655, 270, 562],
    up: [886, 655, 282, 562],
  },
  snowManOutdoor: {
    down: [120, 14, 220, 384],
    right: [451, 20, 199, 378],
    up: [752, 14, 221, 384],
  },
  snowWomanOutdoor: {
    down: [115, 399, 224, 389],
    right: [449, 402, 203, 386],
    up: [748, 399, 229, 389],
  },
  snowManIndoor: {
    down: [137, 792, 191, 333],
    right: [462, 792, 173, 333],
    up: [760, 792, 193, 333],
  },
  snowWomanIndoor: {
    down: [138, 1126, 187, 311],
    right: [451, 1126, 185, 311],
    up: [765, 1126, 189, 311],
  },
  beachMan: {
    down: [110, 40, 260, 545],
    right: [507, 40, 260, 545],
    up: [889, 40, 270, 545],
  },
  beachWoman: {
    down: [53, 639, 365, 585],
    right: [464, 639, 342, 585],
    up: [844, 639, 363, 585],
  },
};
const atlas = typeof Image === "undefined" ? null : new Image();
if (atlas)
  atlas.src = new URL("./assets/characters-b.png", import.meta.url).href;
const desertAtlas = typeof Image === "undefined" ? null : new Image();
if (desertAtlas)
  desertAtlas.src = new URL(
    "./assets/characters-desert.png",
    import.meta.url,
  ).href;
const snowAtlas = typeof Image === "undefined" ? null : new Image();
if (snowAtlas)
  snowAtlas.src = new URL("./assets/characters-snow.png", import.meta.url).href;
const beachAtlas = typeof Image === "undefined" ? null : new Image();
if (beachAtlas)
  beachAtlas.src = new URL(
    "./assets/characters-beach.png",
    import.meta.url,
  ).href;

export function characterFrame(role = "hero", face = "down") {
  const palette = frames[role] ?? frames.mina;
  const direction = face === "left" ? "right" : face;
  const [x, y, width, height] = palette[direction] ?? palette.down;
  return { x, y, width, height, mirrored: face === "left" };
}

export function drawCharacter(
  ctx,
  { x, y, face = "down", role = "hero", walking = false, time = 0 },
  image = role.startsWith("beach")
    ? beachAtlas
    : role.startsWith("snow")
      ? snowAtlas
      : role.startsWith("desert")
        ? desertAtlas
        : atlas,
) {
  if (!image?.complete || !image.naturalWidth) return;
  const frame = characterFrame(role, face);
  const scale = role.startsWith("snow")
    ? (role.endsWith("Outdoor") ? 57 : 52) / frame.height
    : role.startsWith("desert") || role.startsWith("beach")
      ? 0.1
      : 0.15;
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);
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
