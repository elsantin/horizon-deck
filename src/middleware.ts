import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = ['/login', '/api/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('horizon_session')

  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path))

  // Si ya tiene sesión y va al login, redirigir al inicio
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si no tiene sesión y no es ruta pública, redirigir al login
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Aplicar el middleware a todas las rutas excepto los assets estáticos de Next
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
