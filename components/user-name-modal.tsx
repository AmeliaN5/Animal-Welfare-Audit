"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/contexts/user-context"
import { User } from "lucide-react"

/** 공통 접속 비밀번호 — 맞아야 대시보드가 열립니다. */
const ACCESS_PASSWORD = "251222"

export function UserNameModal() {
  const { isNameSet, setUserName } = useUser()
  const [inputName, setInputName] = useState("")
  const [inputPassword, setInputPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = inputName.trim()
    if (!name) return

    if (inputPassword !== ACCESS_PASSWORD) {
      setPasswordError("비밀번호가 올바르지 않습니다.")
      return
    }

    setPasswordError(null)
    setUserName(name)
  }

  return (
    <Dialog open={!isNameSet}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            이름을 입력해주세요
          </DialogTitle>
          <DialogDescription>
            팀 공통 비밀번호를 입력한 뒤, 협업에 쓸 이름을 적어주세요. 체크·메모에 이름이
            표시됩니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="audit-access-password">비밀번호</Label>
            <Input
              id="audit-access-password"
              type="password"
              placeholder="공통 비밀번호"
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value)
                setPasswordError(null)
              }}
              className="rounded-xl"
              autoComplete="off"
              autoFocus
            />
            {passwordError ? (
              <p className="text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-user-name">이름</Label>
            <Input
              id="audit-user-name"
              placeholder="예: 김철수"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="rounded-xl"
              autoComplete="name"
            />
          </div>
          <Button
            type="submit"
            disabled={!inputName.trim() || !inputPassword}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            시작하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
