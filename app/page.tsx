"use client"

import { AuditDashboard } from "@/components/audit-dashboard"
import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "sonner"

export default function Home() {
  return (
    <UserProvider>
      <AuditDashboard />
      <Toaster position="top-center" richColors closeButton />
    </UserProvider>
  )
}
