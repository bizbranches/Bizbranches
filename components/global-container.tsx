"use client"

import { PropsWithChildren } from "react"
import { usePathname } from "next/navigation"

export default function GlobalContainer({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/"

  // Only wrap known top-level listing/utility sections. Everything else, including clean
  // business detail pages like '/:slug', renders at full width with page-level paddings.
  const shouldWrap = (
    pathname.startsWith("/add") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/city") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/admin")
  )

  if (!shouldWrap) return <>{children}</>

  // Default: 100% width on mobile, 70% on md+
  return (
    <div className="mx-auto w-full md:w-[70%] min-h-[calc(100vh-var(--header-footer-offset,0px))]">
      {children}
    </div>
  )
}
