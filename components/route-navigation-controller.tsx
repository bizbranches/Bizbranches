"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function RouteNavigationController() {
  const pathname = usePathname()
  const search = useSearchParams()
  const lastNavRef = useRef<string>("")
  const firstRender = useRef(true)

  // Show overlay when user clicks on internal links or uses browser nav
  useEffect(() => {
    const show = () => (window as any).__routeLoaderShow?.()

    const onClick = (e: MouseEvent) => {
      // Only intercept left-clicks without modifier keys
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      let el = e.target as HTMLElement | null
      while (el && el.tagName !== "A") el = el.parentElement
      if (!el) return
      const a = el as HTMLAnchorElement
      if (a.target === "_blank" || a.download) return
      const href = a.getAttribute("href") || ""
      // Internal path
      if (href.startsWith("/") && !href.startsWith("//")) {
        show()
      }
    }

    const onPopState = () => show()

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  // Show+hide overlay around route changes (covers programmatic router.push)
  useEffect(() => {
    const key = `${pathname}?${search?.toString() || ""}`
    if (lastNavRef.current === key) return
    lastNavRef.current = key

    // Skip showing on very first mount
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    // Immediately show loader for this transition
    ;(window as any).__routeLoaderShow?.()

    // Hide after a short delay to let the new route paint
    const t = setTimeout(() => {
      (window as any).__routeLoaderHide?.()
    }, 600)
    return () => clearTimeout(t)
  }, [pathname, search])

  return null
}
