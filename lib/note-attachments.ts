import type { Attachment } from "@/hooks/use-realtime-audit"

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
  "avif",
  "bmp",
  "svg",
  "tif",
  "tiff",
  "ico",
  "jfif",
  "pjpeg",
  "pjp",
])

export function normalizeAttachments(raw: unknown): Attachment[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean) as Attachment[]
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed.filter(Boolean) as Attachment[]) : []
    } catch {
      return []
    }
  }
  if (typeof raw === "object") return [raw as Attachment]
  return []
}

export function isImageAttachment(type: string, fileName?: string) {
  if (type.startsWith("image/")) return true
  if (!type && fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
    return IMAGE_EXT.has(ext)
  }
  return false
}

export function guessMimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jfif: "image/jpeg",
    pjpeg: "image/jpeg",
    pjp: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heic",
    tif: "image/tiff",
    tiff: "image/tiff",
  }
  if (byExt[ext]) return byExt[ext]
  if (IMAGE_EXT.has(ext)) return "image/jpeg"
  return "application/octet-stream"
}

export { IMAGE_EXT }
