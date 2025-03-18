import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check auth status
  const { data: { user }, error } = await supabase.auth.getUser()

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/api/protected']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Keep your existing matcher configuration
export const config = {
  matcher: [
    // Auth required routes
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/protected/:path*',
    // Routes that use Supabase client but don't require auth
    '/auth/:path*',
    '/api/auth/:path*',
    '/listings/:path*',
  ]
}