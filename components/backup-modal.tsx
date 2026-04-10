"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { DatabaseBackup, Upload } from "lucide-react"
import {
  downloadAuditBackupJson,
  parseAuditBackupJson,
  restoreAuditBackupReplace,
} from "@/lib/audit-backup-file"
import { toast } from "sonner"

export function BackupModal() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<ReturnType<
    typeof parseAuditBackupJson
  > | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDownload = () => {
    try {
      downloadAuditBackupJson()
      toast.success("백업 파일을 저장했어요. 카톡·메일·클라우드에 올려 두면 안전해요.")
    } catch {
      toast.error("파일 저장에 실패했어요. 다시 시도해 주세요.")
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : ""
      const parsed = parseAuditBackupJson(text)
      if (!parsed || Object.keys(parsed.items).length === 0) {
        toast.error("백업 파일 형식이 맞지 않거나 비어 있어요.")
        e.target.value = ""
        return
      }
      setPendingPayload(parsed)
      setConfirmOpen(true)
    }
    reader.readAsText(file, "utf-8")
    e.target.value = ""
  }

  const doRestore = () => {
    if (!pendingPayload) return
    try {
      restoreAuditBackupReplace(pendingPayload)
    } catch {
      toast.error("복구 중 오류가 났어요.")
    }
    setPendingPayload(null)
    setConfirmOpen(false)
    setOpen(false)
  }

  return (
    <>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o)
          if (!o) setPendingPayload(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>백업으로 덮어쓸까요?</AlertDialogTitle>
            <AlertDialogDescription>
              지금 이 브라우저에 있는 감사 기록(체크·메모·진행·이름)이 백업 파일 내용으로{" "}
              <strong>모두 바뀝니다</strong>. 되돌리려면 덮어쓰기 전에 만든 백업 파일이 있어야
              해요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-primary"
              onClick={(ev) => {
                ev.preventDefault()
                doRestore()
              }}
            >
              네, 복구할게요
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFile}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl border-primary/30 hover:bg-primary/10"
          >
            <DatabaseBackup className="mr-2 h-4 w-4" />
            백업 / 복구
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5 text-primary" />
              파일로 백업하기
            </DialogTitle>
            <DialogDescription className="text-left">
              Supabase 없이도, <strong>JSON 파일 하나</strong>로 체크·메모·진행 상태를 저장할 수
              있어요. 파일을 카톡·이메일·iCloud·USB에 두면 백업이에요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              className="w-full rounded-xl bg-primary hover:bg-primary/90"
              onClick={handleDownload}
            >
              <DatabaseBackup className="mr-2 h-4 w-4" />
              백업 파일 받기
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              백업 파일에서 복구
            </Button>
            <p className="text-xs text-muted-foreground">
              복구는 이 브라우저의 감사 데이터를 백업 내용으로 교체합니다. 같은 사이트·같은
              기기에서 하세요.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
