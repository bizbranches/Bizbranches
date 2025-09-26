"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function NotFoundWithParams() {
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref")

  return (
    <div className="px-6 py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-2">The page you're looking for doesn't exist.</p>
      {ref && <p className="text-muted-foreground">You came from: {ref}</p>}
    </div>
  )
}

export default function NotFoundContent() {
  return (
    <Suspense fallback={
      <div className="px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-2">The page you're looking for doesn't exist.</p>
      </div>
    }>
      <NotFoundWithParams />
    </Suspense>
  )
}