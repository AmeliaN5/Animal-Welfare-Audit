"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import {
  getActivityStorageKey,
  getChecklistStorageKey,
  getNotesStorageKey,
  loadActivityFromStorage,
  loadChecklistFromStorage,
  loadNotesFromStorage,
  loadProgressFromStorage,
  LOCAL_PROGRESS_STORAGE_KEY,
  mergeActivityById,
  mergeChecklistsForCategory,
  mergeNotesById,
  mergeProgressByCategory,
} from "@/lib/audit-local-persistence"

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000

function pushLocalActivityLog(
  categoryId: string,
  log: Omit<ActivityLog, "id" | "created_at">
) {
  if (typeof window === "undefined") return
  const key = getActivityStorageKey(categoryId)
  const existing = window.localStorage.getItem(key)
  let logs: ActivityLog[] = []
  if (existing) {
    try {
      logs = JSON.parse(existing) as ActivityLog[]
    } catch {
      logs = []
    }
  }
  const next: ActivityLog = {
    id: `local-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    ...log,
  }
  const updated = [next, ...logs].slice(0, 50)
  window.localStorage.setItem(key, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent("audit-local-activity-updated", { detail: { categoryId } }))
}

export interface ChecklistItem {
  id: string
  item_id: string
  category_id: string
  is_checked: boolean
  checked_by: string | null
  checked_at: string | null
  created_at: string
}

export interface Attachment {
  url: string
  name: string
  type: string
  size: number
}

export interface SharedNote {
  id: string
  item_id: string
  category_id: string
  content: string
  author_name: string
  attachments: Attachment[] | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  category_id: string
  item_id: string | null
  action_type: string
  action_description: string
  performed_by: string
  created_at: string
}

export interface CategoryProgress {
  id: string
  category_id: string
  status: "not_started" | "in_progress" | "completed"
  progress_percentage: number
  updated_by: string | null
  updated_at: string
}

export function useRealtimeChecklist(categoryId: string) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchItems = useCallback(async () => {
    if (!isConfigured) return
    
    const supabase = createClient()
    const localRows = loadChecklistFromStorage(categoryId)
    
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("category_id", categoryId)

    if (!error && data) {
      setChecklistItems(mergeChecklistsForCategory(localRows, data))
    }
  }, [categoryId, isConfigured])

  useEffect(() => {
    if (!isConfigured) {
      if (typeof window !== "undefined") {
        const stored = loadChecklistFromStorage(categoryId)
        setChecklistItems(stored)
      }
      setLoading(false)
      return
    }

    const localRows = loadChecklistFromStorage(categoryId)
    setChecklistItems(localRows)

    // Initial fetch
    fetchItems().then(() => setLoading(false))

    // Start polling for real-time updates
    pollingRef.current = setInterval(fetchItems, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [categoryId, isConfigured, fetchItems])

  useEffect(() => {
    if (typeof window === "undefined" || loading) return
    window.localStorage.setItem(
      getChecklistStorageKey(categoryId),
      JSON.stringify(checklistItems)
    )
  }, [categoryId, checklistItems, loading])

  const toggleItem = useCallback(
    async (itemId: string, isChecked: boolean, userName: string) => {
      if (!isConfigured) {
        setChecklistItems((prev) => {
          const existingItem = prev.find((item) => item.item_id === itemId)
          if (existingItem) {
            return prev.map((item) =>
              item.id === existingItem.id
                ? {
                    ...item,
                    is_checked: isChecked,
                    checked_by: isChecked ? userName : null,
                    checked_at: isChecked ? new Date().toISOString() : null,
                  }
                : item
            )
          }

          return [
            ...prev,
            {
              id: `local-check-${itemId}`,
              item_id: itemId,
              category_id: categoryId,
              is_checked: isChecked,
              checked_by: isChecked ? userName : null,
              checked_at: isChecked ? new Date().toISOString() : null,
              created_at: new Date().toISOString(),
            },
          ]
        })
        if (isChecked) {
          pushLocalActivityLog(categoryId, {
            category_id: categoryId,
            item_id: itemId,
            action_type: "check",
            action_description: "항목을 체크했습니다",
            performed_by: userName,
          })
        }
        return
      }

      // Update local state immediately for instant UI feedback
      const checkedAt = isChecked ? new Date().toISOString() : null
      setChecklistItems((prev) => {
        const existingItem = prev.find((item) => item.item_id === itemId)
        if (existingItem) {
          return prev.map((item) =>
            item.item_id === itemId
              ? {
                  ...item,
                  is_checked: isChecked,
                  checked_by: isChecked ? userName : null,
                  checked_at: checkedAt,
                }
              : item
          )
        }
        return [
          ...prev,
          {
            id: `local-check-${itemId}`,
            item_id: itemId,
            category_id: categoryId,
            is_checked: isChecked,
            checked_by: isChecked ? userName : null,
            checked_at: checkedAt,
            created_at: new Date().toISOString(),
          },
        ]
      })

      try {
        const supabase = createClient()
        const existingItem = checklistItems.find((item) => item.item_id === itemId)

        if (existingItem && existingItem.id && !existingItem.id.startsWith('local-')) {
          const { error: upErr } = await supabase
            .from("checklist_items")
            .update({
              is_checked: isChecked,
              checked_by: isChecked ? userName : null,
              checked_at: checkedAt,
            })
            .eq("id", existingItem.id)
          if (upErr) {
            console.error("[v0] Checklist update error (non-fatal):", upErr)
          }
        } else {
          const { error: insErr } = await supabase
            .from("checklist_items")
            .insert({
              item_id: itemId,
              category_id: categoryId,
              is_checked: isChecked,
              checked_by: isChecked ? userName : null,
              checked_at: checkedAt,
            })
          if (insErr) {
            console.error("[v0] Checklist insert error (non-fatal):", insErr)
          }
        }

        if (isChecked) {
          const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
          const { data: recentLogs } = await supabase
            .from("activity_logs")
            .select("id")
            .eq("category_id", categoryId)
            .eq("item_id", itemId)
            .eq("action_type", "check")
            .eq("performed_by", userName)
            .gte("created_at", fiveSecondsAgo)
            .limit(1)

          if (!recentLogs || recentLogs.length === 0) {
            await supabase.from("activity_logs").insert({
              category_id: categoryId,
              item_id: itemId,
              action_type: "check",
              action_description: "항목을 체크했습니다",
              performed_by: userName,
            })
          }
        } else {
          await supabase
            .from("activity_logs")
            .delete()
            .eq("category_id", categoryId)
            .eq("item_id", itemId)
            .in("action_type", ["check", "uncheck"])
        }
        
        // Trigger immediate refresh after action
        fetchItems()
      } catch (err) {
        console.error("[v0] Checklist DB error (using local state):", err)
      }

      // Log activity locally if checked
      if (isChecked) {
        pushLocalActivityLog(categoryId, {
          category_id: categoryId,
          item_id: itemId,
          action_type: "check",
          action_description: "항목을 체크했습니다",
          performed_by: userName,
        })
      }
    },
    [categoryId, checklistItems, isConfigured, fetchItems]
  )

  return { checklistItems, loading, toggleItem, refetch: fetchItems }
}

export function useRealtimeNotes(categoryId: string) {
  const [notes, setNotes] = useState<SharedNote[]>([])
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!isConfigured) return
    
    const supabase = createClient()
    const localNotes = loadNotesFromStorage(categoryId)
    
    const { data, error } = await supabase
      .from("shared_notes")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setNotes(mergeNotesById(localNotes, data))
    }
  }, [categoryId, isConfigured])

  useEffect(() => {
    if (!isConfigured) {
      if (typeof window !== "undefined") {
        setNotes(loadNotesFromStorage(categoryId))
      }
      setLoading(false)
      return
    }

    const localNotes = loadNotesFromStorage(categoryId)
    setNotes(localNotes)

    // Initial fetch
    fetchNotes().then(() => setLoading(false))

    // Start polling for real-time updates
    pollingRef.current = setInterval(fetchNotes, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [categoryId, isConfigured, fetchNotes])

  useEffect(() => {
    if (typeof window === "undefined" || loading) return
    window.localStorage.setItem(getNotesStorageKey(categoryId), JSON.stringify(notes))
  }, [categoryId, notes, loading])

  const addNote = useCallback(
    async (itemId: string, content: string, authorName: string, attachments?: Attachment[]) => {
      if (!isConfigured) {
        const now = new Date().toISOString()
        setNotes((prev) => [
          {
            id: `local-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            item_id: itemId,
            category_id: categoryId,
            content,
            author_name: authorName,
            attachments: attachments && attachments.length > 0 ? attachments : null,
            created_at: now,
            updated_at: now,
          },
          ...prev,
        ])
        pushLocalActivityLog(categoryId, {
          category_id: categoryId,
          item_id: itemId,
          action_type: "note",
          action_description: `메모를 추가했습니다: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
          performed_by: authorName,
        })
        return
      }

      try {
        const supabase = createClient()
        const { data: inserted, error: insErr } = await supabase
          .from("shared_notes")
          .insert({
            item_id: itemId,
            category_id: categoryId,
            content,
            author_name: authorName,
            attachments: attachments && attachments.length > 0 ? attachments : null,
          })
          .select()
          .single()
        if (insErr) throw insErr
        if (inserted) {
          setNotes((prev) => mergeNotesById([inserted as SharedNote], prev))
        }

        const attachmentText = attachments && attachments.length > 0 
          ? ` (첨부파일 ${attachments.length}개)` 
          : ""
        
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
        const { data: recentLogs } = await supabase
          .from("activity_logs")
          .select("id")
          .eq("category_id", categoryId)
          .eq("item_id", itemId)
          .eq("action_type", "note")
          .eq("performed_by", authorName)
          .gte("created_at", fiveSecondsAgo)
          .limit(1)

        if (!recentLogs || recentLogs.length === 0) {
          await supabase.from("activity_logs").insert({
            category_id: categoryId,
            item_id: itemId,
            action_type: "note",
            action_description: `메모를 추가했습니다: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"${attachmentText}`,
            performed_by: authorName,
          })
        }
        
        // Trigger immediate refresh after action
        fetchNotes()
      } catch {
        const now = new Date().toISOString()
        setNotes((prev) => [
          {
            id: `local-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            item_id: itemId,
            category_id: categoryId,
            content,
            author_name: authorName,
            attachments: attachments && attachments.length > 0 ? attachments : null,
            created_at: now,
            updated_at: now,
          },
          ...prev,
        ])
        pushLocalActivityLog(categoryId, {
          category_id: categoryId,
          item_id: itemId,
          action_type: "note",
          action_description: `메모를 추가했습니다: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
          performed_by: authorName,
        })
      }
    },
    [categoryId, isConfigured, fetchNotes]
  )

  const updateNote = useCallback(
    async (
      noteId: string,
      content: string,
      authorName: string,
      attachments?: Attachment[] | null
    ) => {
      const applyLocal = () => {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  content,
                  author_name: authorName,
                  updated_at: new Date().toISOString(),
                  ...(attachments !== undefined
                    ? {
                        attachments:
                          attachments && attachments.length > 0 ? attachments : null,
                      }
                    : {}),
                }
              : note
          )
        )
      }

      if (!isConfigured) {
        applyLocal()
        return
      }

      const note = notes.find((n) => n.id === noteId)

      try {
        const supabase = createClient()
        const updatePayload: Record<string, unknown> = {
          content,
          updated_at: new Date().toISOString(),
        }
        if (attachments !== undefined) {
          updatePayload.attachments =
            attachments && attachments.length > 0 ? attachments : null
        }

        const { data: updated, error: upErr } = await supabase
          .from("shared_notes")
          .update(updatePayload)
          .eq("id", noteId)
          .select()
          .single()

        if (upErr) throw upErr
        if (updated) {
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? (updated as SharedNote) : n))
          )
        }

        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
        const { data: recentLogs } = await supabase
          .from("activity_logs")
          .select("id")
          .eq("category_id", categoryId)
          .eq("item_id", note?.item_id || null)
          .eq("action_type", "note_edit")
          .eq("performed_by", authorName)
          .gte("created_at", fiveSecondsAgo)
          .limit(1)

        if (!recentLogs || recentLogs.length === 0) {
          await supabase.from("activity_logs").insert({
            category_id: categoryId,
            item_id: note?.item_id || null,
            action_type: "note_edit",
            action_description: `메모를 수정했습니다: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
            performed_by: authorName,
          })
        }
        
        // Trigger immediate refresh after action
        fetchNotes()
      } catch {
        applyLocal()
      }
    },
    [categoryId, isConfigured, notes, fetchNotes]
  )

  const deleteNote = useCallback(
    async (noteId: string, authorName: string) => {
      if (!isConfigured) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId))
        return
      }

      const supabase = createClient()
      const note = notes.find((n) => n.id === noteId)
      
      // Delete the note
      await supabase.from("shared_notes").delete().eq("id", noteId)

      // Delete all activity logs related to this note (add, edit, delete)
      if (note?.item_id) {
        await supabase
          .from("activity_logs")
          .delete()
          .eq("category_id", categoryId)
          .eq("item_id", note.item_id)
          .in("action_type", ["note", "note_edit", "note_delete"])
      }
      
      // Trigger immediate refresh after action
      fetchNotes()
    },
    [categoryId, isConfigured, notes, fetchNotes]
  )

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes }
}

export function useRealtimeActivityLog(categoryId: string) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!isConfigured) return
    
    const supabase = createClient()
    const localLogs = loadActivityFromStorage(categoryId)
    
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setLogs(mergeActivityById(localLogs, data, 50))
    }
  }, [categoryId, isConfigured])

  useEffect(() => {
    const syncFromLocalStorage = () => {
      if (typeof window === "undefined") return
      const localRaw = window.localStorage.getItem(getActivityStorageKey(categoryId))
      if (!localRaw) return
      try {
        const localLogs = JSON.parse(localRaw) as ActivityLog[]
        setLogs((prev) => {
          const merged = [...localLogs, ...prev]
          const deduped = merged.filter(
            (log, idx, arr) => arr.findIndex((x) => x.id === log.id) === idx
          )
          return deduped.slice(0, 50)
        })
      } catch {
        // Ignore malformed local storage
      }
    }

    const onLocalActivityUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ categoryId?: string }>
      if (customEvent.detail?.categoryId === categoryId) {
        syncFromLocalStorage()
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("audit-local-activity-updated", onLocalActivityUpdated)
    }

    if (!isConfigured) {
      syncFromLocalStorage()
      setLoading(false)
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("audit-local-activity-updated", onLocalActivityUpdated)
        }
      }
    }

    const localLogs = loadActivityFromStorage(categoryId)
    setLogs(localLogs)

    // Initial fetch
    fetchLogs().then(() => setLoading(false))
    syncFromLocalStorage()

    // Start polling for real-time updates
    pollingRef.current = setInterval(fetchLogs, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("audit-local-activity-updated", onLocalActivityUpdated)
      }
    }
  }, [categoryId, isConfigured, fetchLogs])

  useEffect(() => {
    if (typeof window === "undefined" || loading) return
    window.localStorage.setItem(getActivityStorageKey(categoryId), JSON.stringify(logs))
  }, [categoryId, logs, loading])

  return { logs, loading, refetch: fetchLogs }
}

export function useRealtimeProgress() {
  const [progressData, setProgressData] = useState<CategoryProgress[]>([])
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!isConfigured) return
    
    const supabase = createClient()
    const localProgress = loadProgressFromStorage()
    
    const { data, error } = await supabase
      .from("category_progress")
      .select("*")

    if (!error && data) {
      setProgressData(mergeProgressByCategory(localProgress, data))
    }
  }, [isConfigured])

  useEffect(() => {
    if (!isConfigured) {
      if (typeof window !== "undefined") {
        setProgressData(loadProgressFromStorage())
      }
      setLoading(false)
      return
    }

    const localProgress = loadProgressFromStorage()
    setProgressData(localProgress)

    // Initial fetch
    fetchProgress().then(() => setLoading(false))

    // Start polling for real-time updates
    pollingRef.current = setInterval(fetchProgress, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isConfigured, fetchProgress])

  useEffect(() => {
    if (typeof window === "undefined" || loading) return
    window.localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(progressData))
  }, [progressData, loading])

  const updateProgress = useCallback(
    async (
      categoryId: string,
      status: "not_started" | "in_progress" | "completed",
      progressPercentage: number,
      userName: string,
      logActivity: boolean = true
    ) => {
      if (!isConfigured) {
        const now = new Date().toISOString()
        setProgressData((prev) => {
          const existing = prev.find((p) => p.category_id === categoryId)
          if (existing) {
            return prev.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    status,
                    progress_percentage: progressPercentage,
                    updated_by: userName,
                    updated_at: now,
                  }
                : p
            )
          }
          return [
            ...prev,
            {
              id: `local-progress-${categoryId}`,
              category_id: categoryId,
              status,
              progress_percentage: progressPercentage,
              updated_by: userName,
              updated_at: now,
            },
          ]
        })
        return
      }

      const supabase = createClient()
      const existing = progressData.find((p) => p.category_id === categoryId)
      const now = new Date().toISOString()

      // Always update local state first for immediate UI feedback
      const updateLocalState = () => {
        setProgressData((prev) => {
          const existingLocal = prev.find((p) => p.category_id === categoryId)
          if (existingLocal) {
            return prev.map((p) =>
              p.category_id === categoryId
                ? {
                    ...p,
                    status,
                    progress_percentage: progressPercentage,
                    updated_by: userName,
                    updated_at: now,
                  }
                : p
            )
          }
          return [
            ...prev,
            {
              id: `local-progress-${categoryId}`,
              category_id: categoryId,
              status,
              progress_percentage: progressPercentage,
              updated_by: userName,
              updated_at: now,
            },
          ]
        })
      }

      // Update local state immediately
      console.log("[v0] updateProgress called:", { categoryId, status, progressPercentage })
      updateLocalState()

      try {
        if (existing && existing.id && !existing.id.startsWith('local-')) {
          const { error: upErr } = await supabase
            .from("category_progress")
            .update({
              status,
              progress_percentage: progressPercentage,
              updated_by: userName,
              updated_at: now,
            })
            .eq("id", existing.id)
          if (upErr) {
            console.error("[v0] Progress update error (non-fatal):", upErr)
          }
        } else {
          const { error: insErr } = await supabase
            .from("category_progress")
            .insert({
              category_id: categoryId,
              status,
              progress_percentage: progressPercentage,
              updated_by: userName,
            })
          if (insErr) {
            console.error("[v0] Progress insert error (non-fatal):", insErr)
          }
        }
      } catch (err) {
        console.error("[v0] Progress DB error (using local state):", err)
      }

      // Only log activity if explicitly requested (not for auto status changes)
      if (logActivity) {
        // Check for recent duplicate log (within last 5 seconds)
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
        const { data: recentLogs } = await supabase
          .from("activity_logs")
          .select("id")
          .eq("category_id", categoryId)
          .eq("action_type", "progress")
          .eq("performed_by", userName)
          .gte("created_at", fiveSecondsAgo)
          .limit(1)

        if (!recentLogs || recentLogs.length === 0) {
          await supabase.from("activity_logs").insert({
            category_id: categoryId,
            item_id: null,
            action_type: "progress",
            action_description: `진행 상태를 "${status === "not_started" ? "시작 전" : status === "in_progress" ? "진행 중" : "완료"}"(${progressPercentage}%)로 변경했습니다`,
            performed_by: userName,
          })
        }
      }
      
      // Trigger immediate refresh after action
      fetchProgress()
    },
    [progressData, isConfigured, fetchProgress]
  )

  return { progressData, loading, updateProgress, refetch: fetchProgress }
}
