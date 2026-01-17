export async function getCroppedBlob(imageSrc, cropPixels) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  ctx.drawImage(
    img,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, cropPixels.width, cropPixels.height
  );
  return await new Promise((res) => canvas.toBlob(res, "image/png", 0.92));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
