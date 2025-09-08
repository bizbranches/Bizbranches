"use client"

import { PropsWithChildren } from "react"
import { usePathname } from "next/navigation"

export default function GlobalContainer({ children }: PropsWithChildren) {
  const pathname = usePathname()

  // Exclude homepage and business detail pages from the 70% width wrapper
  const exclude = pathname === "/" || (pathname?.startsWith("/business/"))
  const isAddPage = pathname?.startsWith("/add")

  if (exclude) return <>{children}</>

  if (isAddPage) {
    // 100% width on mobile, 70% on md+ for Add Business page
    return (
      <div className="mx-auto w-full md:w-[70%] min-h-[calc(100vh-var(--header-footer-offset,0px))]">
        {children}
      </div>
    )
  }

  // Default: 100% width on mobile, 70% on md+
  return (
    <div className="mx-auto w-full md:w-[70%] min-h-[calc(100vh-var(--header-footer-offset,0px))]">
      {children}
    </div>
  )
}
