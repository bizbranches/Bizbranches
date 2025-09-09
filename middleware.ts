import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip Next.js internals and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // file requests
  ) {
    return NextResponse.next()
  }

  // Redirect from /business/:slug -> /:slug (clean URL)
  const directBusiness = pathname.match(/^\/business\/([^\/]+)\/?$/i)
  if (directBusiness) {
    const slug = directBusiness[1]
    const url = new URL(`/${slug}`, req.url)
    return NextResponse.redirect(url, 308)
  }

  // Match legacy nested patterns and redirect to canonical /:slug
  // Examples to catch:
  //  - /city/karachi/business/digital-skills-house
  //  - /category/education/business/digital-skills-house
  //  - /city/lahore/category/it/business/abc
  const nestedBusiness = pathname.match(/^\/(?:city|category)(?:\/[^\/]+){1,3}\/business\/([^\/]+)\/?$/i)
  if (nestedBusiness) {
    const slug = nestedBusiness[1]
    const url = new URL(`/${slug}`, req.url)
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|static).*)'],
}
