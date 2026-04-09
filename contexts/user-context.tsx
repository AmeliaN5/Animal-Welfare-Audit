"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserContextType {
  userName: string
  setUserName: (name: string) => void
  isNameSet: boolean
  resetName: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem("audit_user_name")
    if (storedName) {
      setUserNameState(storedName)
      setIsNameSet(true)
    }
  }, [])

  const setUserName = (name: string) => {
    setUserNameState(name)
    setIsNameSet(true)
    localStorage.setItem("audit_user_name", name)
  }

  const resetName = () => {
    setUserNameState("")
    setIsNameSet(false)
    localStorage.removeItem("audit_user_name")
  }

  return (
    <UserContext.Provider value={{ userName, setUserName, isNameSet, resetName }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
