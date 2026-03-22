import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  // Cookie HttpOnly: el navegador la envía en cada request pero JS no puede leerla
  response.cookies.set('horizon_session', 'authenticated', {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
    sameSite: 'strict',
  })

  return response
}
