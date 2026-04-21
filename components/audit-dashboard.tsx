"use client"

import { useState, useEffect } from "react"
import { categories } from "@/lib/audit-data"
import type { Category } from "@/lib/audit-data"
import { CategoryCard } from "@/components/category-card"
import { CategoryDetail } from "@/components/category-detail"
import { DocumentsModal } from "@/components/documents-modal"
import { ReportModal } from "@/components/report-modal"
import { UserNameModal } from "@/components/user-name-modal"
import { useRealtimeProgress } from "@/hooks/use-realtime-audit"
import { useUser } from "@/contexts/user-context"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User } from "lucide-react"
import { BackupModal } from "@/components/backup-modal"
type StatDetailKind = "categories" | "total" | "completed" | "in_progress" | null

export function AuditDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [statDetail, setStatDetail] = useState<StatDetailKind>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { progressData, updateProgress } = useRealtimeProgress()
  const { userName, isNameSet, resetName } = useUser()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const totalItems = categories.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  )
  const repeatIssues = categories.reduce(
    (acc, cat) =>
      acc + cat.items.filter((item) => item.isRepeatIssue).length,
    0
  )

  const getCategoryProgress = (categoryId: string) => {
    if (!isMounted) return undefined
    return progressData.find((p) => p.category_id === categoryId)
  }

  const completedCategories = isMounted ? progressData.filter(
    (p) => p.status === "completed"
  ).length : 0
  const inProgressCategories = isMounted ? progressData.filter(
    (p) => p.status === "in_progress"
  ).length : 0

  const completedCategoryList = categories.filter(
    (c) => getCategoryProgress(c.id)?.status === "completed"
  )
  const inProgressCategoryList = categories.filter(
    (c) => getCategoryProgress(c.id)?.status === "in_progress"
  )

  const statBtnClass =
    "w-full rounded-2xl bg-card p-4 text-center shadow-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <UserNameModal />
      <Dialog open={statDetail !== null} onOpenChange={(o) => !o && setStatDetail(null)}>
        <DialogContent className="max-h-[min(80vh,520px)] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statDetail === "categories" && "카테고리"}
              {statDetail === "total" && "총 항목"}
              {statDetail === "completed" && "완료"}
              {statDetail === "in_progress" && "진행 중"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            {statDetail === "categories" && (
              <ul className="space-y-2 text-foreground">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.title}</span>
                  </li>
                ))}
              </ul>
            )}
            {statDetail === "total" && (
              <>
                <p>
                  감사 체크리스트 항목은 총{" "}
                  <span className="font-medium text-foreground">{totalItems}</span>개입니다.
                </p>
                <ul className="space-y-1.5 border-t pt-3">
                  {categories.map((c) => (
                    <li key={c.id} className="flex justify-between gap-2">
                      <span className="text-foreground">{c.title}</span>
                      <span>{c.items.length}개</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {statDetail === "completed" && (
              <>
                {completedCategoryList.length === 0 ? (
                  <p>완료로 표시된 카테고리가 없습니다.</p>
                ) : (
                  <ul className="space-y-2 text-foreground">
                    {completedCategoryList.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="text-lg">{c.icon}</span>
                        <span>{c.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {statDetail === "in_progress" && (
              <>
                {inProgressCategoryList.length === 0 ? (
                  <p>진행 중인 카테고리가 없습니다.</p>
                ) : (
                  <ul className="space-y-2 text-foreground">
                    {inProgressCategoryList.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="text-lg">{c.icon}</span>
                        <span>{c.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="mx-auto max-w-2xl">
        {selectedCategory ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CategoryDetail
              category={selectedCategory}
              onBack={() => setSelectedCategory(null)}
              progressData={progressData}
              updateProgress={updateProgress}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {/* User Badge */}
            {isNameSet && (
              <div className="mb-4 flex justify-end animate-in fade-in slide-in-from-top-2 duration-300">
                <Badge
                  variant="outline"
                  className="flex cursor-pointer items-center gap-1 rounded-full border-primary/30 px-3 py-1 transition-colors hover:bg-primary/10"
                  onClick={resetName}
                  title="클릭하여 이름 변경"
                >
                  <User className="h-3 w-3" />
                  {userName}
                </Badge>
              </div>
            )}

            {/* Header */}
            <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="mb-2 flex items-center justify-center gap-2">
                <span className="text-4xl">🐾</span>
                <span className="text-3xl">🦥</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Animal Welfare Audit
              </h1>
              <h2 className="text-xl font-semibold text-primary">
                Dashboard
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                SEALIFE COEX Animal Welfare Audit 기록용
              </p>
              <p className="mt-1 text-xs text-green-600">
                실시간 협업 모드 활성화
              </p>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 sm:grid-cols-4">
              <button
                type="button"
                className={statBtnClass}
                onClick={() => setStatDetail("categories")}
              >
                <p className="text-2xl font-bold text-foreground">
                  {categories.length}
                </p>
                <p className="text-xs text-muted-foreground">카테고리</p>
              </button>
              <button
                type="button"
                className={statBtnClass}
                onClick={() => setStatDetail("total")}
              >
                <p className="text-2xl font-bold text-foreground">
                  {totalItems}
                </p>
                <p className="text-xs text-muted-foreground">총 항목</p>
              </button>
              <button
                type="button"
                className={statBtnClass}
                onClick={() => setStatDetail("completed")}
              >
                <p className="text-2xl font-bold text-green-500">
                  {completedCategories}
                </p>
                <p className="text-xs text-muted-foreground">완료</p>
              </button>
              <button
                type="button"
                className={statBtnClass}
                onClick={() => setStatDetail("in_progress")}
              >
                <p className="text-2xl font-bold text-blue-500">
                  {inProgressCategories}
                </p>
                <p className="text-xs text-muted-foreground">진행 중</p>
              </button>
            </div>

            {/* Repeat Issues Alert */}
            {repeatIssues > 0 && (
              <div className="mb-6 rounded-2xl bg-orange-50 p-3 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">{repeatIssues}건</span>의
                  반복지적 항목이 있습니다. 우선적으로 확인해주세요!
                </p>
              </div>
            )}

            {/* Sloth decoration */}
            <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-secondary/50 p-3 animate-in fade-in zoom-in-95 duration-500 delay-200">
              <span className="text-2xl">🦥</span>
              <p className="text-sm text-muted-foreground">
                천천히, 하지만 꼼꼼하게 체크해요!
              </p>
              <span className="text-2xl">💕</span>
            </div>

            {/* Categories */}
            <div className="mb-8 space-y-4">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  progress={getCategoryProgress(category.id)}
                  onClick={() => setSelectedCategory(category)}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <DocumentsModal />
              <ReportModal />
              <BackupModal />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-700">
              <span>🦥</span>
              <span>Made with love for aquarium welfare</span>
              <span>💕</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
