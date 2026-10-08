const brotherImage = typeof Image === "undefined" ? null : new Image();
if (brotherImage)
  brotherImage.src = new URL(
    "./assets/brother-beach.png",
    import.meta.url,
  ).href;
export function drawBeachBrother(ctx, { x, y }, image = brotherImage) {
  if (!image?.complete || !image.naturalWidth) return;
  const width = 118;
  const height = Math.round((image.naturalHeight / image.naturalWidth) * width);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    Math.round(x - width / 2),
    Math.round(y - height / 2),
    width,
    height,
  );
  ctx.restore();
}
