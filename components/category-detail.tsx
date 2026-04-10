"use client"

import { useState, useEffect } from "react"
import type { Category } from "@/lib/audit-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  Circle,
  PlayCircle,
  Send,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
  FileText,
  Paperclip,
  Image as ImageIcon,
  File,
} from "lucide-react"
import {
  useRealtimeChecklist,
  useRealtimeNotes,
  useRealtimeActivityLog,
  type Attachment,
  type SharedNote,
} from "@/hooks/use-realtime-audit"
import { useUser } from "@/contexts/user-context"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import {
  guessMimeFromName,
  isImageAttachment,
  normalizeAttachments,
} from "@/lib/note-attachments"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"

/** Blob 업로드가 없거나 실패할 때 DB에 넣는 data URL 상한 (행 크기 과다 방지) */
const MAX_INLINE_ATTACHMENT_BYTES = 5 * 1024 * 1024

interface CategoryDetailProps {
  category: Category
  onBack: () => void
  progressData: Array<{
    id: string
    category_id: string
    status: string
    progress_percentage: number
    updated_by: string | null
    updated_at: string | null
  }>
  updateProgress: (
    categoryId: string,
    status: string,
    progressPercentage: number,
    userName: string,
    notifyOthers?: boolean
  ) => Promise<void>
}

export function CategoryDetail({ category, onBack, progressData, updateProgress }: CategoryDetailProps) {
  const { userName } = useUser()
  const { checklistItems, toggleItem } = useRealtimeChecklist(category.id)
  const { notes, addNote, updateNote, deleteNote } = useRealtimeNotes(category.id)
  const { logs } = useRealtimeActivityLog(category.id)
  const [progressWidth, setProgressWidth] = useState(0)
  const [expandedNoteItem, setExpandedNoteItem] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Edit/Delete state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([])
  const [editPendingFiles, setEditPendingFiles] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(
    null
  )
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null)
  
  // File upload state (per checklist item — avoids cross-item clashes)
  const [pendingFilesByItem, setPendingFilesByItem] = useState<Record<string, File[]>>(
    {}
  )
  const [isUploading, setIsUploading] = useState(false)
  const isBackendReady = isSupabaseConfigured()

  const getItemChecked = (itemId: string) => {
    const item = checklistItems.find((ci) => ci.item_id === itemId)
    return item?.is_checked || false
  }

  const getItemCheckedBy = (itemId: string) => {
    const item = checklistItems.find((ci) => ci.item_id === itemId)
    return item?.checked_by || null
  }

  const handleToggle = async (itemId: string) => {
    try {
      const isCurrentlyChecked = getItemChecked(itemId)
      const willBeChecked = !isCurrentlyChecked
      await toggleItem(itemId, willBeChecked, userName)
      
      // Calculate new completed count after this toggle
      const newCompletedCount = category.items.filter((item) => {
        if (item.id === itemId) return willBeChecked
        return getItemChecked(item.id)
      }).length
      const newProgressPercent = Math.round((newCompletedCount / totalCount) * 100)
      
      // If checking and status is not_started, change to in_progress
      if (willBeChecked && currentStatus === "not_started") {
        await updateProgress(category.id, "in_progress", newProgressPercent, userName, false)
      }
      // If unchecking and no items are checked, change back to not_started
      else if (!willBeChecked && newCompletedCount === 0 && currentStatus === "in_progress") {
        await updateProgress(category.id, "not_started", 0, userName, false)
      }
    } catch {
      toast.error("체크 저장에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const completedCount = category.items.filter((item) =>
    getItemChecked(item.id)
  ).length
  const totalCount = category.items.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const currentProgress = progressData.find(
    (p) => p.category_id === category.id
  )
  const currentStatus = currentProgress?.status || "not_started"

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth(progressPercent)
    }, 100)
    return () => clearTimeout(timer)
  }, [progressPercent])

  const handleStatusChange = async (
    status: "not_started" | "in_progress" | "completed"
  ) => {
    try {
      await updateProgress(category.id, status, progressPercent, userName)
    } catch {
      toast.error("진행 상태를 저장하지 못했습니다. 다시 시도해주세요.")
    }
  }

  const processFilesToAttachments = async (files: File[]): Promise<Attachment[]> => {
    if (files.length === 0) return []
    const out: Attachment[] = []
    setIsUploading(true)
    try {
      for (const file of files) {
        let url: string | null = null

        if (isBackendReady) {
          try {
            const formData = new FormData()
            formData.append("file", file)
            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })
            if (response.ok) {
              const data = (await response.json()) as { url?: string }
              if (data.url) url = data.url
            }
          } catch {
            /* Blob 미설정·네트워크 오류 → 아래에서 data URL 시도 */
          }
        }

        if (!url) {
          if (file.size > MAX_INLINE_ATTACHMENT_BYTES) {
            toast.error(
              `"${file.name}"은(는) 5MB를 넘습니다. Vercel Blob을 켜거나 더 작은 파일로 올려주세요.`
            )
            continue
          }
          try {
            url = await fileToDataUrl(file)
          } catch {
            toast.error(`"${file.name}"을(를) 읽지 못했습니다.`)
            continue
          }
        }

        out.push({
          url,
          name: file.name,
          type: file.type || guessMimeFromName(file.name),
          size: file.size,
        })
      }
    } finally {
      setIsUploading(false)
    }
    return out
  }

  const handleAddNote = async (itemId: string) => {
    const pendingFiles = pendingFilesByItem[itemId] ?? []
    if (!noteContent.trim() && pendingFiles.length === 0) return
    setIsSubmitting(true)

    try {
      const uploadedAttachments =
        pendingFiles.length > 0 ? await processFilesToAttachments(pendingFiles) : []

      if (pendingFiles.length > 0 && uploadedAttachments.length === 0) {
        toast.error("첨부가 저장되지 않았습니다. 파일 크기(5MB 이하)를 확인해 주세요.")
        return
      }

      await addNote(
        itemId,
        noteContent.trim() || "(첨부파일)",
        userName,
        uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      )

      // Auto change status to in_progress if currently not_started
      if (currentStatus === "not_started") {
        try {
          await updateProgress(category.id, "in_progress", progressPercent, userName)
        } catch (error) {
          console.error("Auto status update error:", error)
        }
      }

      setNoteContent("")
      setPendingFilesByItem((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      setExpandedNoteItem(null)
    } catch (error) {
      console.error("Save note error:", error)
      toast.error("메모를 저장하지 못했습니다. 연결을 확인하고 다시 시도해주세요.")
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }
  
  const addSelectedFilesForItem = (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const picked = Array.from(files)
    setPendingFilesByItem((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), ...picked],
    }))
  }

  const handleFileSelect =
    (itemId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget
      addSelectedFilesForItem(itemId, input.files)
      // Defer reset: clearing synchronously can drop the update in some browsers
      queueMicrotask(() => {
        input.value = ""
      })
    }

  const removePendingFile = (itemId: string, index: number) => {
    setPendingFilesByItem((prev) => {
      const list = prev[itemId] ?? []
      const nextList = list.filter((_, i) => i !== index)
      const next = { ...prev }
      if (nextList.length === 0) delete next[itemId]
      else next[itemId] = nextList
      return next
    })
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    if (input.files && input.files.length > 0) {
      setEditPendingFiles((prev) => [...prev, ...Array.from(input.files!)])
    }
    queueMicrotask(() => {
      input.value = ""
    })
  }

  const handleEditNote = async (noteId: string) => {
    if (
      !editContent.trim() &&
      editAttachments.length === 0 &&
      editPendingFiles.length === 0
    )
      return
    setIsSubmitting(true)
    try {
      let merged = [...editAttachments]
      if (editPendingFiles.length > 0) {
        const extra = await processFilesToAttachments(editPendingFiles)
        if (extra.length < editPendingFiles.length) {
          toast.info("일부 첨부만 저장되었거나 크기 제한으로 빠졌을 수 있어요.")
        }
        merged = [...merged, ...extra]
      }
      await updateNote(
        noteId,
        editContent.trim() || "(첨부파일)",
        userName,
        merged.length > 0 ? merged : null
      )
      setEditingNoteId(null)
      setEditContent("")
      setEditAttachments([])
      setEditPendingFiles([])
    } catch (error) {
      console.error("Edit note error:", error)
      toast.error("메모 수정을 저장하지 못했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!deleteConfirmNoteId) return
    setIsSubmitting(true)
    await deleteNote(deleteConfirmNoteId, userName)
    setDeleteConfirmNoteId(null)
    setIsSubmitting(false)
  }

  const startEditNote = (note: SharedNote) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
    setEditAttachments(normalizeAttachments(note.attachments))
    setEditPendingFiles([])
  }

  const cancelEditNote = () => {
    setEditingNoteId(null)
    setEditContent("")
    setEditAttachments([])
    setEditPendingFiles([])
  }

  const getItemNotes = (itemId: string) => {
    return notes.filter((note) => note.item_id === itemId)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get item title from item_id for activity log
  const getItemTitle = (itemId: string | null) => {
    if (!itemId) return null
    const item = category.items.find((i) => i.id === itemId)
    return item?.title || null
  }

  return (
    <div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmNoteId} onOpenChange={() => setDeleteConfirmNoteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>메모 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 메모를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">아니오</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNote}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              예, 삭제합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent
          showCloseButton
          className="max-h-[92vh] max-w-[min(96vw,920px)] overflow-y-auto border-none bg-zinc-950/95 p-4 text-white sm:max-w-[920px] [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10"
        >
          {imagePreview ? (
            <>
              <img
                src={imagePreview.url}
                alt={imagePreview.name}
                className="mx-auto max-h-[min(80vh,720px)] w-auto max-w-full rounded-md object-contain"
              />
              <p className="truncate text-center text-sm text-white/80">{imagePreview.name}</p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      <div className="mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {category.title}
          </h2>
          <p className="text-muted-foreground">총 {totalCount}개 항목</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">진행률</span>
          <span className="font-medium text-foreground">
            {completedCount}/{totalCount} ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* 진행 상태 버튼 */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          진행 상태
        </p>
        <div className="flex gap-2">
          <Button
            variant={currentStatus === "not_started" ? "default" : "outline"}
            size="sm"
            className={`rounded-xl ${
              currentStatus === "not_started"
                ? "bg-gray-500 hover:bg-gray-600"
                : ""
            }`}
            onClick={() => handleStatusChange("not_started")}
          >
            <Circle className="mr-1 h-4 w-4" />
            시작 전
          </Button>
          <Button
            variant={currentStatus === "in_progress" ? "default" : "outline"}
            size="sm"
            className={`rounded-xl ${
              currentStatus === "in_progress"
                ? "bg-blue-500 hover:bg-blue-600"
                : ""
            }`}
            onClick={() => handleStatusChange("in_progress")}
          >
            <PlayCircle className="mr-1 h-4 w-4" />
            진행 중
          </Button>
          <Button
            variant={currentStatus === "completed" ? "default" : "outline"}
            size="sm"
            className={`rounded-xl ${
              currentStatus === "completed"
                ? "bg-green-500 hover:bg-green-600"
                : ""
            }`}
            onClick={() => handleStatusChange("completed")}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            완료
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3 rounded-2xl bg-muted p-1">
          <TabsTrigger
            value="summary"
            className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            내용 요약
          </TabsTrigger>
          <TabsTrigger
            value="checklist"
            className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            체크리스트
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            활동 기록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0">
          <div className="space-y-4">
            {category.items.map((item, index) => (
              <div
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 flex flex-wrap items-start gap-2">
                      <h4 className="font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`${
                          item.priority === "P1"
                            ? "border-red-400 bg-red-50 text-red-700"
                            : item.priority === "P2"
                              ? "border-orange-400 bg-orange-50 text-orange-700"
                              : item.priority === "P3"
                                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                : "border-blue-400 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.sourceCode}
                      </Badge>
                      {item.isRepeatIssue && (
                        <Badge
                          variant="outline"
                          className="border-orange-300 bg-orange-50 text-orange-700"
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          반복지적
                        </Badge>
                      )}
                    </div>
                    
                    {/* Related Sources for repeat issues */}
                    {item.relatedSources && item.relatedSources.length > 0 && (
                      <div className="mb-2 flex flex-wrap items-center gap-1">
                        <span className="text-xs text-muted-foreground">관련:</span>
                        {item.relatedSources.map((source) => (
                          <Badge
                            key={source}
                            variant="outline"
                            className="text-xs border-gray-300 bg-gray-50 text-gray-600"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    {item.actionRequired && (
                      <div className="mb-3 flex items-start gap-2 rounded-xl bg-primary/10 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          {item.actionRequired}
                        </p>
                      </div>
                    )}

                    {/* 공용 메모장 */}
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          메모 ({getItemNotes(item.id).length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          onClick={() =>
                            setExpandedNoteItem(
                              expandedNoteItem === item.id ? null : item.id
                            )
                          }
                        >
                          {expandedNoteItem === item.id
                            ? "접기"
                            : "메모 추가"}
                        </Button>
                      </div>

                      {expandedNoteItem === item.id && (
                        <div className="mb-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Textarea
                            placeholder="메모를 입력하세요..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[80px] rounded-xl"
                          />
                          
                          {/* Pending files preview */}
                          {(pendingFilesByItem[item.id]?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap justify-center gap-3">
                              {(pendingFilesByItem[item.id] ?? []).map((file, index) => (
                                <div
                                  key={`${file.name}-${file.size}-${index}`}
                                  className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm"
                                >
                                  {isImageAttachment(file.type, file.name) && (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  )}
                                  {isImageAttachment(file.type, file.name) ? (
                                    <ImageIcon className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <File className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span className="max-w-[150px] truncate">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removePendingFile(item.id, index)}
                                    className="ml-1 text-muted-foreground hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <input
                                id={`file-input-${item.id}`}
                                type="file"
                                multiple
                                accept="*/*"
                                onChange={handleFileSelect(item.id)}
                                className="max-w-[min(100%,280px)] text-sm text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-muted file:px-2.5 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-muted/80"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl bg-primary hover:bg-primary/90"
                              onClick={() => handleAddNote(item.id)}
                              disabled={
                                (!noteContent.trim() &&
                                  (pendingFilesByItem[item.id]?.length ?? 0) === 0) ||
                                isSubmitting ||
                                isUploading
                              }
                            >
                              {isSubmitting || isUploading ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-4 w-4" />
                              )}
                              {isUploading ? "업로드 중..." : "저장"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {getItemNotes(item.id).length > 0 && (
                        <div className="space-y-2">
                          {getItemNotes(item.id).map((note) => (
                            <div
                              key={note.id}
                              className="rounded-xl bg-muted/50 p-3"
                            >
                              {editingNoteId === note.id ? (
                                <div className="space-y-3">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[80px] rounded-xl"
                                  />
                                  {editAttachments.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                      {editAttachments.map((att, idx) => (
                                        <div
                                          key={`${att.url.slice(0, 40)}-${idx}`}
                                          className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-2"
                                        >
                                          {isImageAttachment(att.type, att.name) ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setImagePreview({
                                                  url: att.url,
                                                  name: att.name,
                                                })
                                              }
                                              className="overflow-hidden rounded-md border border-transparent focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                                            >
                                              <img
                                                src={att.url}
                                                alt={att.name}
                                                className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                                              />
                                            </button>
                                          ) : (
                                            <File className="h-10 w-10 text-muted-foreground" />
                                          )}
                                          <div className="flex max-w-[140px] items-center gap-1">
                                            <span className="truncate text-xs text-muted-foreground">
                                              {att.name}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditAttachments((prev) =>
                                                  prev.filter((_, i) => i !== idx)
                                                )
                                              }
                                              className="shrink-0 text-muted-foreground hover:text-destructive"
                                              aria-label="첨부 삭제"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {editPendingFiles.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                      {editPendingFiles.map((file, idx) => (
                                        <div
                                          key={`${file.name}-${file.size}-${idx}`}
                                          className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-xs"
                                        >
                                          {isImageAttachment(file.type, file.name) ? (
                                            <img
                                              src={URL.createObjectURL(file)}
                                              alt=""
                                              className="h-8 w-8 rounded object-cover"
                                            />
                                          ) : (
                                            <File className="h-4 w-4" />
                                          )}
                                          <span className="max-w-[100px] truncate">{file.name}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditPendingFiles((prev) =>
                                                prev.filter((_, i) => i !== idx)
                                              )
                                            }
                                            className="text-muted-foreground hover:text-destructive"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      <input
                                        type="file"
                                        multiple
                                        accept="*/*"
                                        onChange={handleEditFileSelect}
                                        className="max-w-[min(100%,260px)] text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="rounded-xl"
                                      onClick={cancelEditNote}
                                    >
                                      <X className="mr-1 h-4 w-4" />
                                      취소
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded-xl bg-primary hover:bg-primary/90"
                                      onClick={() => handleEditNote(note.id)}
                                      disabled={
                                        (!editContent.trim() &&
                                          editAttachments.length === 0 &&
                                          editPendingFiles.length === 0) ||
                                        isSubmitting ||
                                        isUploading
                                      }
                                    >
                                      {isSubmitting || isUploading ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="mr-1 h-4 w-4" />
                                      )}
                                      {isUploading ? "업로드 중..." : "저장"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <>
                                  <div className="flex items-start justify-between">
                                    <p className="flex-1 text-sm text-foreground">
                                      {note.content}
                                    </p>
                                    <div className="ml-2 flex shrink-0 gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => startEditNote(note)}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                        onClick={() => setDeleteConfirmNoteId(note.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {normalizeAttachments(note.attachments).length > 0 && (
                                    <div className="mt-3 flex flex-wrap justify-center gap-4">
                                      {normalizeAttachments(note.attachments).map((attachment, idx) => (
                                        <div
                                          key={idx}
                                          className="flex max-w-[200px] flex-col items-center gap-1.5 text-center"
                                        >
                                          {isImageAttachment(attachment.type, attachment.name) ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setImagePreview({
                                                  url: attachment.url,
                                                  name: attachment.name,
                                                })
                                              }
                                              className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="mx-auto block h-32 w-32 object-cover sm:h-36 sm:w-36"
                                              />
                                            </button>
                                          ) : null}
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex w-full items-center justify-center gap-1 rounded-lg bg-background px-2 py-1 text-xs hover:bg-primary/10"
                                          >
                                            {isImageAttachment(attachment.type, attachment.name) ? (
                                              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                            ) : (
                                              <File className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            )}
                                            <span className="truncate group-hover:text-primary">
                                              {attachment.name}
                                            </span>
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{note.author_name}</span>
                                    <Clock className="ml-2 h-3 w-3" />
                                    <span>{formatTime(note.created_at)}</span>
                                    {note.updated_at !== note.created_at && (
                                      <span className="text-xs italic">(수정됨)</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-0">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                {category.items.map((item, index) => {
                  const isChecked = getItemChecked(item.id)
                  const checkedBy = getItemCheckedBy(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 cursor-pointer ${
                        isChecked
                          ? "bg-green-50"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={(e) => {
                        // Only toggle if not clicking directly on checkbox
                        if (!(e.target as HTMLElement).closest('[data-slot="checkbox"]')) {
                          handleToggle(item.id)
                        }
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div
                          className={`text-sm ${
                            isChecked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          <span className="font-medium">{item.title}</span>
                          <Badge
                            variant="outline"
                            className={`ml-2 text-xs ${
                              item.priority === "P1"
                                ? "border-red-400 bg-red-50 text-red-700"
                                : item.priority === "P2"
                                  ? "border-orange-400 bg-orange-50 text-orange-700"
                                  : item.priority === "P3"
                                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                    : "border-blue-400 bg-blue-50 text-blue-700"
                            }`}
                          >
                            {item.sourceCode}
                          </Badge>
                          {item.isRepeatIssue && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-orange-300 bg-orange-50 text-xs text-orange-700"
                            >
                              반복
                            </Badge>
                          )}
                        </div>
                        {checkedBy && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {checkedBy} 님이 체크함
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                활동 기록
              </h3>
              {logs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  아직 활동 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => {
                    const itemTitle = getItemTitle(log.item_id)
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 border-l-2 border-primary/30 pl-4 animate-in fade-in slide-in-from-left-2 duration-200"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div
                          className={`mt-1 rounded-full p-1 ${
                            log.action_type === "check"
                              ? "bg-green-100 text-green-600"
                              : log.action_type === "uncheck"
                                ? "bg-gray-100 text-gray-600"
                                : log.action_type === "note"
                                  ? "bg-blue-100 text-blue-600"
                                  : log.action_type === "note_edit"
                                    ? "bg-amber-100 text-amber-600"
                                    : log.action_type === "note_delete"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {log.action_type === "check" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : log.action_type === "uncheck" ? (
                            <Circle className="h-4 w-4" />
                          ) : log.action_type === "note" ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : log.action_type === "note_edit" ? (
                            <Pencil className="h-4 w-4" />
                          ) : log.action_type === "note_delete" ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{log.performed_by}</span>
                            {" 님이 "}
                            {log.action_description}
                          </p>
                          {itemTitle && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {itemTitle}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatTime(log.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
