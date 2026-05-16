import { NextResponse } from 'next/server'

// Lightweight middleware: only checks that a token IS present.
// Actual token verification (firebase-admin or password check) happens inside
// each API route handler to avoid bundling firebase-admin into the Edge runtime.
export function middleware(request) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isUploadApi = pathname.startsWith('/api/upload')

  if (!isAdminPage && !isUploadApi) return NextResponse.next()

  if (isAdminPage) {
    // Page navigation: browsers don't send custom headers for page loads,
    // so we read the token from a cookie set at login time.
    const token = request.cookies.get('admin-token')?.value
    if (!token || token.length < 16) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // API routes: token is sent as Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization') || ''
  const hasToken = authHeader.startsWith('Bearer ') && authHeader.length > 10
  if (!hasToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/upload/:path*'],
}
