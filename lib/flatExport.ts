import { flatSvg } from "./flatSvg";
import { FLAT_EXPORT_PX, type FlatParams, type FlatSilhouetteId } from "./flatTypes";

export function flatFilename(kind: "svg" | "png", silhouette: FlatSilhouetteId, date = new Date()) {
  return `squish-flat-${silhouette}-${fileStamp(date)}.${kind}`;
}

export function downloadFlatSvg(params: FlatParams) {
  const svg = flatSvg(params, "export", "export");
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), flatFilename("svg", params.silhouette));
}

export async function downloadFlatPng(params: FlatParams) {
  const svg = flatSvg(params, "export", "export");
  const png = await rasterizeSvg(svg, FLAT_EXPORT_PX.w, FLAT_EXPORT_PX.h);
  downloadBlob(png, flatFilename("png", params.silhouette));
}

async function rasterizeSvg(svg: string, width: number, height: number) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Не удалось собрать PNG"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось собрать PNG");
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("Не удалось собрать PNG");
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function fileStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
