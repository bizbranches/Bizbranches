"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function RouteNavigationController() {
  const pathname = usePathname()
  const search = useSearchParams()
  const lastNavRef = useRef<string>("")
  const firstRender = useRef(true)
  const lastClickTimer = useRef<number | null>(null)
  const lastPopTimer = useRef<number | null>(null)

  // Show overlay when user clicks on internal links or uses browser nav
  useEffect(() => {
    const show = () => (window as any).__routeLoaderShow?.()
    const hide = () => (window as any).__routeLoaderHide?.()

    const onClick = (e: MouseEvent) => {
      // Only intercept left-clicks without modifier keys
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      let el = e.target as HTMLElement | null
      while (el && el.tagName !== "A") el = el.parentElement
      if (!el) return
      const a = el as HTMLAnchorElement
      if (a.target === "_blank" || a.download) return
      const href = a.getAttribute("href") || ""
      // Internal path only
      if (!(href.startsWith("/") && !href.startsWith("//"))) return

      // If the href resolves to the SAME pathname+search, do not show the loader
      try {
        const dest = new URL(href, window.location.origin)
        const currentKey = `${window.location.pathname}?${window.location.search.replace(/^\?/, "")}`
        const destKey = `${dest.pathname}?${dest.search.replace(/^\?/, "")}`
        if (destKey === currentKey) {
          return
        }
      } catch {
        // fall through
      }

      show()
      // Fallback auto-hide in case navigation is cancelled or same-route navigation occurs
      if (lastClickTimer.current) window.clearTimeout(lastClickTimer.current)
      lastClickTimer.current = window.setTimeout(() => hide(), 1500)
    }

    const onPopState = () => {
      show()
      // Ensure we always hide after a short delay even if key doesn't change
      if (lastPopTimer.current) window.clearTimeout(lastPopTimer.current)
      lastPopTimer.current = window.setTimeout(() => hide(), 800)
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      if (lastClickTimer.current) window.clearTimeout(lastClickTimer.current)
      if (lastPopTimer.current) window.clearTimeout(lastPopTimer.current)
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
    const t = window.setTimeout(() => {
      (window as any).__routeLoaderHide?.()
    }, 600)
    return () => window.clearTimeout(t)
  }, [pathname, search])

  return null
}
