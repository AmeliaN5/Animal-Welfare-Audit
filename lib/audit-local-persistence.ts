import { categories } from "@/lib/audit-data"
import type {
  ActivityLog,
  CategoryProgress,
  ChecklistItem,
  SharedNote,
} from "@/hooks/use-realtime-audit"

export const LOCAL_PROGRESS_STORAGE_KEY = "audit_local_progress"

export function getChecklistStorageKey(categoryId: string) {
  return `audit_local_checklist_${categoryId}`
}

export function getNotesStorageKey(categoryId: string) {
  return `audit_local_notes_${categoryId}`
}

export function getActivityStorageKey(categoryId: string) {
  return `audit_local_activity_${categoryId}`
}

export function loadChecklistFromStorage(categoryId: string): ChecklistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(getChecklistStorageKey(categoryId))
    if (!raw) return []
    return JSON.parse(raw) as ChecklistItem[]
  } catch {
    return []
  }
}

export function loadNotesFromStorage(categoryId: string): SharedNote[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(getNotesStorageKey(categoryId))
    if (!raw) return []
    return JSON.parse(raw) as SharedNote[]
  } catch {
    return []
  }
}

export function loadProgressFromStorage(): CategoryProgress[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CategoryProgress[]
  } catch {
    return []
  }
}

export function loadActivityFromStorage(categoryId: string): ActivityLog[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(getActivityStorageKey(categoryId))
    if (!raw) return []
    return JSON.parse(raw) as ActivityLog[]
  } catch {
    return []
  }
}

/** Same category: server rows win when item_id matches; keep local-only rows. */
export function mergeChecklistsForCategory(
  local: ChecklistItem[],
  remote: ChecklistItem[]
): ChecklistItem[] {
  const remoteIds = new Set(remote.map((r) => r.item_id))
  return [...remote, ...local.filter((l) => !remoteIds.has(l.item_id))]
}

export function mergeNotesById(local: SharedNote[], remote: SharedNote[]): SharedNote[] {
  const byId = new Map<string, SharedNote>()
  for (const n of remote) byId.set(n.id, n)
  for (const n of local) {
    if (!byId.has(n.id)) byId.set(n.id, n)
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function mergeProgressByCategory(
  local: CategoryProgress[],
  remote: CategoryProgress[]
): CategoryProgress[] {
  const byCat = new Map<string, CategoryProgress>()
  for (const p of local) byCat.set(p.category_id, p)
  for (const p of remote) {
    const existing = byCat.get(p.category_id)
    if (!existing) {
      byCat.set(p.category_id, p)
    } else {
      const tr = new Date(p.updated_at).getTime()
      const tl = new Date(existing.updated_at).getTime()
      byCat.set(p.category_id, tr >= tl ? p : existing)
    }
  }
  return Array.from(byCat.values())
}

export function mergeActivityById(
  local: ActivityLog[],
  remote: ActivityLog[],
  max = 100
): ActivityLog[] {
  const byId = new Map<string, ActivityLog>()
  for (const l of remote) byId.set(l.id, l)
  for (const l of local) {
    if (!byId.has(l.id)) byId.set(l.id, l)
  }
  return Array.from(byId.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, max)
}

export interface AuditReportSnapshot {
  checklistItems: ChecklistItem[]
  notes: SharedNote[]
  progressData: CategoryProgress[]
  activityLogs: ActivityLog[]
}

export function collectAllLocalAuditData(): AuditReportSnapshot {
  const checklistItems: ChecklistItem[] = []
  const notes: SharedNote[] = []
  const activityLogs: ActivityLog[] = []
  if (typeof window === "undefined") {
    return { checklistItems, notes, progressData: [], activityLogs }
  }
  for (const cat of categories) {
    checklistItems.push(...loadChecklistFromStorage(cat.id))
    notes.push(...loadNotesFromStorage(cat.id))
    activityLogs.push(...loadActivityFromStorage(cat.id))
  }
  const progressData = loadProgressFromStorage()
  return { checklistItems, notes, progressData, activityLogs }
}

function checklistKey(c: ChecklistItem) {
  return `${c.category_id}:${c.item_id}`
}

export function mergeReportChecklists(
  local: ChecklistItem[],
  remote: ChecklistItem[]
): ChecklistItem[] {
  const map = new Map<string, ChecklistItem>()
  for (const r of remote) map.set(checklistKey(r), r)
  for (const l of local) {
    if (!map.has(checklistKey(l))) map.set(checklistKey(l), l)
  }
  return Array.from(map.values())
}

export function mergeReportSnapshots(
  local: AuditReportSnapshot,
  remote: AuditReportSnapshot
): AuditReportSnapshot {
  return {
    checklistItems: mergeReportChecklists(local.checklistItems, remote.checklistItems),
    notes: mergeNotesById(local.notes, remote.notes),
    progressData: mergeProgressByCategory(local.progressData, remote.progressData),
    activityLogs: mergeActivityById(local.activityLogs, remote.activityLogs, 100),
  }
}
