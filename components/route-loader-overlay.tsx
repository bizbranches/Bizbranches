"use client"

import { useEffect, useState } from "react"
import FancyLoader from "@/components/fancy-loader"

export default function RouteLoaderOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    ;(window as any).__routeLoaderShow = () => setVisible(true)
    ;(window as any).__routeLoaderHide = () => setVisible(false)
    return () => {
      try { delete (window as any).__routeLoaderShow } catch {}
      try { delete (window as any).__routeLoaderHide } catch {}
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-transparent">
      <FancyLoader />
    </div>
  )
}
