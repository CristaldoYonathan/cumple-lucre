const DEFAULT_MAX_PX = 320;
const DEFAULT_QUALITY = 0.62;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

export interface ResizeImageOptions {
  maxPx?: number;
  quality?: number;
  maxInputBytes?: number;
}

/**
 * Redimensiona y comprime una imagen para guardarla como JPEG liviano.
 */
export async function resizeImage(
  file: File,
  options: ResizeImageOptions = {}
): Promise<string> {
  const maxPx = options.maxPx ?? DEFAULT_MAX_PX;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const maxInputBytes = options.maxInputBytes ?? MAX_INPUT_BYTES;

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  if (file.size > maxInputBytes) {
    throw new Error("La imagen es demasiado pesada (máx 25 MB)");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");

  ctx.drawImage(img, 0, 0, width, height);

  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  // Si aún pesa mucho, bajar calidad un poco más
  if (dataUrl.length > 120_000) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.45);
  }

  return dataUrl;
}
