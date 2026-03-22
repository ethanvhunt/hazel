import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ["/team/login", "/team/register", "/customer/login", "/customer/register"]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes - check for session
  const teamSession = request.cookies.get("team-session")
  const customerSession = request.cookies.get("customer-session")

  if (pathname.startsWith("/team")) {
    if (!teamSession) {
      return NextResponse.redirect(new URL("/team/login", request.url))
    }
  }

  if (pathname.startsWith("/customer")) {
    if (!customerSession) {
      return NextResponse.redirect(new URL("/customer/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/team/:path*", "/customer/:path*"],
}
