"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Circle,
  PlayCircle,
  Languages,
  Image as ImageIcon,
  File,
} from "lucide-react"
import { categories } from "@/lib/audit-data"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import {
  collectAllLocalAuditData,
  mergeReportSnapshots,
} from "@/lib/audit-local-persistence"
import { isImageAttachment, normalizeAttachments } from "@/lib/note-attachments"
import { itemTitleForReportLang } from "@/lib/report-item-translations"
import type {
  ChecklistItem,
  SharedNote,
  CategoryProgress,
  ActivityLog,
} from "@/hooks/use-realtime-audit"

interface ReportData {
  checklistItems: ChecklistItem[]
  notes: SharedNote[]
  progressData: CategoryProgress[]
  activityLogs: ActivityLog[]
}

type Language = "ko" | "en"

const translations = {
  ko: {
    reportTitle: "동물 복지 감사 보고서",
    generateReport: "보고서 생성",
    generatedAt: "생성일",
    overviewTab: "전체 요약",
    repeatTab: "반복지적",
    categoryTab: "카테고리별",
    totalItems: "총 항목",
    checked: "체크 완료",
    notesWritten: "작성된 메모",
    repeatIssues: "반복지적",
    repeatDescription: "이전 감사에서도 지적되었던 항목들입니다. 우선적으로 개선이 필요합니다.",
    category: "카테고리",
    relatedSources: "관련 출처",
    progress: "진행률",
    completed: "완료",
    inProgress: "진행 중",
    notStarted: "시작 전",
    completedItems: "완료된 항목",
    memos: "메모",
    recentActivity: "최근 활동",
    noProgress: "아직 진행된 내용이 없습니다.",
    checkedBy: "체크",
    at: "에",
    noRepeatIssues: "반복지적 항목이 없습니다.",
    language: "언어",
    translatingMemos: "메모 번역 중…",
    attachmentOnly: "(첨부파일)",
    categories: {
      "water-lss": "수질 및 생명유지시스템(LSS)",
      "data-management": "데이터 및 개체 관리",
      "animal-welfare": "동물 복지 및 환경 풍부화",
      "facility-safety": "시설 보수 및 안전",
      "nutrition-health": "영양 및 건강 관리",
      "compliance": "규정 준수 및 문서화",
    } as Record<string, string>,
  },
  en: {
    reportTitle: "Animal Welfare Audit Report",
    generateReport: "Generate Report",
    generatedAt: "Generated at",
    overviewTab: "Overview",
    repeatTab: "Repeat Issues",
    categoryTab: "By Category",
    totalItems: "Total Items",
    checked: "Checked",
    notesWritten: "Notes",
    repeatIssues: "Repeat Issues",
    repeatDescription: "These items were flagged in previous audits and require priority improvement.",
    category: "Category",
    relatedSources: "Related Sources",
    progress: "Progress",
    completed: "Completed",
    inProgress: "In Progress",
    notStarted: "Not Started",
    completedItems: "Completed Items",
    memos: "Notes",
    recentActivity: "Recent Activity",
    noProgress: "No progress recorded yet.",
    checkedBy: "checked by",
    at: "at",
    noRepeatIssues: "No repeat issues found.",
    language: "Language",
    translatingMemos: "Translating notes…",
    attachmentOnly: "(Attachment)",
    categories: {
      "water-lss": "Water Quality & Life Support System",
      "data-management": "Data & Specimen Management",
      "animal-welfare": "Animal Welfare & Enrichment",
      "facility-safety": "Facility Maintenance & Safety",
      "nutrition-health": "Nutrition & Health Management",
      "compliance": "Compliance & Documentation",
    } as Record<string, string>,
  },
}

function getRepeatIssuesSummary() {
  const repeatIssues: Array<{
    id: string
    title: string
    sourceCode: string
    relatedSources: string[]
    priority: string
    categoryId: string
    categoryTitle: string
  }> = []

  categories.forEach((cat) => {
    cat.items
      .filter((item) => item.isRepeatIssue)
      .forEach((item) => {
        repeatIssues.push({
          id: item.id,
          title: item.title,
          sourceCode: item.sourceCode,
          relatedSources: item.relatedSources || [],
          priority: item.priority,
          categoryId: cat.id,
          categoryTitle: cat.title,
        })
      })
  })

  return repeatIssues
}

export function ReportModal() {
  const [reportData, setReportData] = useState<ReportData>({
    checklistItems: [],
    notes: [],
    progressData: [],
    activityLogs: [],
  })
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [language, setLanguage] = useState<Language>("ko")
  const [memoEnByNoteId, setMemoEnByNoteId] = useState<Record<string, string>>({})
  const [memoTranslating, setMemoTranslating] = useState(false)

  const t = translations[language]

  useEffect(() => {
    if (!isOpen) return

    const local = collectAllLocalAuditData()

    if (!isSupabaseConfigured()) {
      setReportData(local)
      setLoading(false)
      return
    }

    void fetchReportData(local)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || language !== "en") {
      setMemoEnByNoteId({})
      setMemoTranslating(false)
      return
    }

    const toTranslate: { id: string; text: string }[] = []
    for (const n of reportData.notes) {
      const c = n.content.trim()
      if (c === "(첨부파일)" || c === "(Attachment)") continue
      if (/[\uAC00-\uD7AF]/.test(c)) {
        toTranslate.push({ id: n.id, text: c })
      }
    }

    if (toTranslate.length === 0) {
      setMemoEnByNoteId({})
      setMemoTranslating(false)
      return
    }

    let cancelled = false
    setMemoTranslating(true)
    const texts = toTranslate.map((x) => x.text)
    void fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    })
      .then((r) => r.json())
      .then((data: { translations?: string[] }) => {
        if (cancelled || !data.translations) return
        const next: Record<string, string> = {}
        toTranslate.forEach((row, i) => {
          next[row.id] = data.translations![i] ?? row.text
        })
        setMemoEnByNoteId(next)
      })
      .catch(() => {
        if (!cancelled) setMemoEnByNoteId({})
      })
      .finally(() => {
        if (!cancelled) setMemoTranslating(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, language, reportData.notes])

  const fetchReportData = async (localBaseline: ReportData) => {
    setLoading(true)
    const supabase = createClient()
    const [checklistRes, notesRes, progressRes, logsRes] = await Promise.all([
      supabase.from("checklist_items").select("*"),
      supabase
        .from("shared_notes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("category_progress").select("*"),
      supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    const remote: ReportData = {
      checklistItems: checklistRes.data || [],
      notes: notesRes.data || [],
      progressData: progressRes.data || [],
      activityLogs: logsRes.data || [],
    }

    setReportData(mergeReportSnapshots(localBaseline, remote))
    setLoading(false)
  }

  const getCategoryProgress = (categoryId: string) => {
    return reportData.progressData.find((p) => p.category_id === categoryId)
  }

  const getCategoryCheckedItems = (categoryId: string) => {
    return reportData.checklistItems.filter(
      (item) => item.category_id === categoryId && item.is_checked
    )
  }

  const getCategoryNotes = (categoryId: string) => {
    return reportData.notes.filter((note) => note.category_id === categoryId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "completed":
        return { label: t.completed, color: "bg-green-100 text-green-700 border-green-200" }
      case "in_progress":
        return { label: t.inProgress, color: "bg-blue-100 text-blue-700 border-blue-200" }
      default:
        return { label: t.notStarted, color: "bg-gray-100 text-gray-600 border-gray-200" }
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const totalChecked = reportData.checklistItems.filter((item) => item.is_checked).length
  const totalNotes = reportData.notes.length
  const repeatIssues = getRepeatIssuesSummary()

  const noteBodyForLang = (note: SharedNote) => {
    const raw = note.content.trim()
    if (language === "ko") return note.content
    if (raw === "(첨부파일)" || raw === "(Attachment)") return t.attachmentOnly
    if (/[\uAC00-\uD7AF]/.test(raw)) {
      if (memoTranslating && memoEnByNoteId[note.id] === undefined) {
        return null
      }
      return memoEnByNoteId[note.id] ?? note.content
    }
    return note.content
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-primary/30 hover:bg-primary/10"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t.generateReport}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl p-0">
        <DialogHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {t.reportTitle}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t.generatedAt}: {new Date().toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <div className="flex rounded-lg border bg-muted/50 p-0.5">
                <button
                  onClick={() => setLanguage("ko")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    language === "ko"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    language === "en"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="border-b px-6 py-2">
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50">
                  <TabsTrigger value="overview" className="rounded-lg text-sm">
                    {t.overviewTab}
                  </TabsTrigger>
                  <TabsTrigger value="repeat" className="rounded-lg text-sm">
                    {t.repeatTab}
                  </TabsTrigger>
                  <TabsTrigger value="category" className="rounded-lg text-sm">
                    {t.categoryTab}
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[60vh]">
                <div className="p-6">
                  <TabsContent value="overview" className="m-0 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-slate-700">{totalItems}</p>
                          <p className="text-xs text-slate-500">{t.totalItems}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-green-700">{totalChecked}</p>
                          <p className="text-xs text-green-600">
                            {t.checked} ({Math.round((totalChecked / totalItems) * 100)}%)
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-blue-700">{totalNotes}</p>
                          <p className="text-xs text-blue-600">{t.notesWritten}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold text-orange-700">{repeatIssues.length}</p>
                          <p className="text-xs text-orange-600">{t.repeatIssues}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Category Progress Overview */}
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                          {t.categoryTab}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {categories.map((cat) => {
                          const progress = getCategoryProgress(cat.id)
                          const checkedItems = getCategoryCheckedItems(cat.id)
                          const status = getStatusLabel(progress?.status)
                          const percent = Math.round((checkedItems.length / cat.items.length) * 100)
                          const categoryTitle = t.categories[cat.id] || cat.title

                          return (
                            <div
                              key={cat.id}
                              className="flex items-center gap-3 rounded-xl bg-muted/30 p-3"
                            >
                              <span className="text-2xl">{cat.icon}</span>
                              <div className="flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-medium">{categoryTitle}</span>
                                  <Badge variant="outline" className={`text-xs ${status.color}`}>
                                    {status.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {checkedItems.length}/{cat.items.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="repeat" className="m-0 space-y-4">
                    {repeatIssues.length === 0 ? (
                      <Card className="border-none bg-green-50 shadow-sm">
                        <CardContent className="flex items-center justify-center gap-2 p-8 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{t.noRepeatIssues}</span>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <Card className="border-none bg-orange-50 shadow-sm">
                          <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                              <RefreshCw className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-orange-800">
                                {repeatIssues.length} {t.repeatIssues}
                              </p>
                              <p className="text-xs text-orange-600">{t.repeatDescription}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-3">
                          {repeatIssues.map((issue, idx) => (
                            <Card key={idx} className="border-none shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                                    <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-medium">
                                        {itemTitleForReportLang(issue.id, issue.title, language)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          issue.priority === "P1"
                                            ? "border-red-300 bg-red-50 text-red-700"
                                            : issue.priority === "P2"
                                              ? "border-orange-300 bg-orange-50 text-orange-700"
                                              : issue.priority === "P3"
                                                ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                                : "border-blue-300 bg-blue-50 text-blue-700"
                                        }`}
                                      >
                                        {issue.sourceCode}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {t.category}: {t.categories[issue.categoryId] || issue.categoryTitle}
                                    </p>
                                    {issue.relatedSources.length > 0 && (
                                      <div className="mt-2 flex flex-wrap items-center gap-1">
                                        <span className="text-xs text-muted-foreground">
                                          {t.relatedSources}:
                                        </span>
                                        {issue.relatedSources.map((source) => (
                                          <Badge
                                            key={source}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {source}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="category" className="m-0 space-y-4">
                    {categories.map((category) => {
                      const progress = getCategoryProgress(category.id)
                      const checkedItems = getCategoryCheckedItems(category.id)
                      const categoryNotes = getCategoryNotes(category.id)
                      const status = getStatusLabel(progress?.status)
                      const categoryTitle = t.categories[category.id] || category.title

                      return (
                        <Card key={category.id} className="border-none shadow-sm">
                          <CardHeader className="border-b bg-muted/30 pb-3 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{category.icon}</span>
                                <div>
                                  <CardTitle className="text-base">{categoryTitle}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {t.progress}: {checkedItems.length}/{category.items.length} (
                                    {Math.round((checkedItems.length / category.items.length) * 100)}%)
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className={status.color}>
                                {getStatusIcon(progress?.status)}
                                <span className="ml-1">{status.label}</span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            {checkedItems.length === 0 && categoryNotes.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground py-4">
                                {t.noProgress}
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {checkedItems.length > 0 && (
                                  <div>
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      {t.completedItems} ({checkedItems.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {checkedItems.map((item) => {
                                        const originalItem = category.items.find(
                                          (i) => i.id === item.item_id
                                        )
                                        return (
                                          <div
                                            key={item.id}
                                            className="flex items-center gap-2 rounded-lg bg-green-50/50 p-2 text-sm"
                                          >
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                            <span className="flex-1">
                                              {itemTitleForReportLang(
                                                item.item_id,
                                                originalItem?.title || item.item_id,
                                                language
                                              )}
                                            </span>
                                            {item.checked_by && (
                                              <span className="text-xs text-muted-foreground">
                                                {item.checked_by}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {categoryNotes.length > 0 && (
                                  <div>
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                                      <MessageSquare className="h-4 w-4 text-blue-600" />
                                      {t.memos} ({categoryNotes.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {categoryNotes.map((note) => {
                                        const relatedItem = category.items.find(
                                          (i) => i.id === note.item_id
                                        )
                                        const noteBody = noteBodyForLang(note)
                                        return (
                                          <div
                                            key={note.id}
                                            className="rounded-lg bg-blue-50/50 p-3"
                                          >
                                            {relatedItem && (
                                              <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                {itemTitleForReportLang(
                                                  relatedItem.id,
                                                  relatedItem.title,
                                                  language
                                                )}
                                              </p>
                                            )}
                                            <p className="text-sm">
                                              {noteBody === null ? (
                                                <span className="text-muted-foreground italic">
                                                  {t.translatingMemos}
                                                </span>
                                              ) : (
                                                noteBody
                                              )}
                                            </p>
                                            {normalizeAttachments(note.attachments).length > 0 && (
                                              <div className="mt-3 flex flex-wrap justify-center gap-3 border-t border-blue-100/80 pt-3">
                                                {normalizeAttachments(note.attachments).map(
                                                  (att, i) => (
                                                    <div
                                                      key={i}
                                                      className="flex max-w-[160px] flex-col items-center gap-1"
                                                    >
                                                      {isImageAttachment(att.type, att.name) ? (
                                                        <a
                                                          href={att.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="block overflow-hidden rounded-lg border bg-white shadow-sm"
                                                        >
                                                          <img
                                                            src={att.url}
                                                            alt={att.name}
                                                            className="h-28 w-28 object-cover"
                                                          />
                                                        </a>
                                                      ) : (
                                                        <File className="h-8 w-8 text-muted-foreground" />
                                                      )}
                                                      <a
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                                                      >
                                                        {isImageAttachment(att.type, att.name) ? (
                                                          <ImageIcon className="h-3 w-3 shrink-0" />
                                                        ) : (
                                                          <File className="h-3 w-3 shrink-0" />
                                                        )}
                                                        <span className="truncate">{att.name}</span>
                                                      </a>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}
                                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                              <User className="h-3 w-3" />
                                              <span>{note.author_name}</span>
                                              <Clock className="ml-2 h-3 w-3" />
                                              <span>{formatShortDate(note.created_at)}</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
