"use client"

import { useState, useEffect } from "react"
import type { Category } from "@/lib/audit-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, PlayCircle } from "lucide-react"
import type { CategoryProgress } from "@/hooks/use-realtime-audit"

interface CategoryCardProps {
  category: Category
  onClick: () => void
  index: number
  progress?: CategoryProgress
}

export function CategoryCard({
  category,
  onClick,
  index,
  progress,
}: CategoryCardProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const repeatIssueCount = category.items.filter(
    (item) => item.isRepeatIssue
  ).length

  // Only show progress data after mounting to avoid hydration mismatch
  const status = isMounted ? (progress?.status || "not_started") : "not_started"
  const progressPercent = isMounted ? (progress?.progress_percentage || 0) : 0

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            완료
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <PlayCircle className="mr-1 h-3 w-3" />
            진행 중
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            <Circle className="mr-1 h-3 w-3" />
            시작 전
          </Badge>
        )
    }
  }

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card
        className="cursor-pointer border-none bg-card shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        style={{
          borderLeft: `4px solid ${category.color}`,
        }}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.items.length}개 항목
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge()}
              {repeatIssueCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-xs text-foreground"
                >
                  반복지적 {repeatIssueCount}건
                </Badge>
              )}
            </div>
          </div>

          {/* 진행률 표시 */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium text-foreground">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === "completed"
                    ? "bg-green-500"
                    : status === "in_progress"
                      ? "bg-blue-500"
                      : "bg-gray-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1">
            {category.items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="inline-block max-w-full truncate rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {item.title}
              </span>
            ))}
            {category.items.length > 3 && (
              <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                +{category.items.length - 3}개
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
