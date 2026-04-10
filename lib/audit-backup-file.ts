const STORAGE_PREFIX = "audit_"

export type AuditBackupFileV1 = {
  auditBackupVersion: 1
  exportedAt: string
  items: Record<string, string>
}

export function collectAuditLocalStorageItems(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const items: Record<string, string> = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      const v = window.localStorage.getItem(key)
      if (v !== null) items[key] = v
    }
  }
  return items
}

export function downloadAuditBackupJson(): void {
  const payload: AuditBackupFileV1 = {
    auditBackupVersion: 1,
    exportedAt: new Date().toISOString(),
    items: collectAuditLocalStorageItems(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  a.href = url
  a.download = `animal-welfare-audit-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseAuditBackupJson(text: string): AuditBackupFileV1 | null {
  try {
    const raw = JSON.parse(text) as unknown
    if (!raw || typeof raw !== "object") return null
    const o = raw as Record<string, unknown>
    if (o.auditBackupVersion !== 1) return null
    if (typeof o.exportedAt !== "string") return null
    if (!o.items || typeof o.items !== "object" || Array.isArray(o.items)) return null
    const items = o.items as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(items)) {
      if (typeof k !== "string" || !k.startsWith(STORAGE_PREFIX)) continue
      if (typeof v !== "string") continue
      try {
        JSON.parse(v)
        out[k] = v
      } catch {
        continue
      }
    }
    return { auditBackupVersion: 1, exportedAt: o.exportedAt, items: out }
  } catch {
    return null
  }
}

/** Removes all audit_* keys, writes backup, reloads the page. */
export function restoreAuditBackupReplace(payload: AuditBackupFileV1): void {
  if (typeof window === "undefined") return
  const toRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k)
  }
  for (const k of toRemove) window.localStorage.removeItem(k)
  for (const [k, v] of Object.entries(payload.items)) {
    window.localStorage.setItem(k, v)
  }
  window.location.reload()
}
