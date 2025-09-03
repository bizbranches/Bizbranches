"use client"

import { PropsWithChildren } from "react"
import { usePathname } from "next/navigation"

export default function GlobalContainer({ children }: PropsWithChildren) {
  const pathname = usePathname()

  // Exclude homepage and business detail pages from the 70% width wrapper
  const exclude = pathname === "/" || (pathname?.startsWith("/business/"))

  if (exclude) return <>{children}</>

  return (
    <div className="mx-auto w-[70%] min-h-[calc(100vh-var(--header-footer-offset,0px))]">
      {children}
    </div>
  )
}
