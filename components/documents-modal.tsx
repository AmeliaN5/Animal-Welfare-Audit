"use client"

import { useState, useEffect } from "react"
import { requiredDocuments } from "@/lib/audit-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, CheckCircle2 } from "lucide-react"

export function DocumentsModal() {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({})
  const [progressWidth, setProgressWidth] = useState(0)

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const completedCount = Object.values(checkedDocs).filter(Boolean).length
  const totalCount = requiredDocuments.length

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth((completedCount / totalCount) * 100)
    }, 100)
    return () => clearTimeout(timer)
  }, [completedCount, totalCount])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full rounded-2xl bg-primary py-6 text-lg font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
        >
          <FileText className="mr-2 h-5 w-5" />
          필수 기록 문서함
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            필수 기록 문서함
          </DialogTitle>
          <DialogDescription>
            감사 전 준비해야 할 필수 문서 목록입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 mt-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">완료 현황</span>
            <span className="font-medium text-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {requiredDocuments.map((doc, index) => (
            <div
              key={doc.id}
              className={`flex items-start gap-3 rounded-2xl p-4 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2 ${
                checkedDocs[doc.id]
                  ? "bg-green-50"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Checkbox
                id={doc.id}
                checked={checkedDocs[doc.id] || false}
                onCheckedChange={() => toggleDoc(doc.id)}
                className="mt-1"
              />
              <label htmlFor={doc.id} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium transition-all duration-200 ${
                      checkedDocs[doc.id]
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {doc.title}
                  </span>
                  {checkedDocs[doc.id] && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in duration-200" />
                  )}
                </div>
                <p
                  className={`mt-1 text-sm transition-colors duration-200 ${
                    checkedDocs[doc.id]
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {doc.description}
                </p>
              </label>
            </div>
          ))}
        </div>

        {completedCount === totalCount && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-green-100 p-4 text-green-700 animate-in zoom-in-95 fade-in duration-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">모든 문서 준비 완료!</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
