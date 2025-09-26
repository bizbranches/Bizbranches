"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function Header() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const closeMenu = () => setOpen(false)
  
  const handleCategoriesClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname === '/') {
      // On homepage, scroll to categories section
      const categoriesSection = document.getElementById('categories-section')
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // On other pages, navigate to homepage then scroll
      router.push('/#categories-section')
    }
    closeMenu()
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight" onClick={closeMenu}>
            BizBranches
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <button onClick={handleCategoriesClick} className="hover:text-accent transition-colors">
            Categories
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/add">Add Your Business</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/pending">Pending Business</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </div>

        {/* Mobile nav */}
        <div id="mobile-nav" className={`${open ? "mt-3" : "hidden"} md:hidden`}>
          <nav className="flex flex-col gap-3 bg-primary/10 rounded-lg p-3">
            <Link href="/" onClick={closeMenu} className="hover:text-accent transition-colors">
              Home
            </Link>
            <button onClick={handleCategoriesClick} className="hover:text-accent transition-colors">
              Categories
            </button>
            <div className="pt-2 flex flex-col gap-2">
              <Button asChild variant="secondary" onClick={closeMenu}>
                <Link href="/add">Add Your Business</Link>
              </Button>
              <Button asChild variant="secondary" onClick={closeMenu}>
                <Link href="/pending">Pending Business</Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
