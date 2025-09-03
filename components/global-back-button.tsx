"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function GlobalBackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Hide on homepage
  if (pathname === "/") return null

  const handleBack = () => {
    // Use history back; if no history, fallback to home
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <div className="mx-auto w-[70%] px-4 pt-2">
      <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </div>
  )
}
