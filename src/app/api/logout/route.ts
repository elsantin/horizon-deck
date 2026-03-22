import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // Eliminar la cookie de sesión estableciendo maxAge a 0
  response.cookies.set('horizon_session', '', { maxAge: 0, path: '/' })
  return response
}
