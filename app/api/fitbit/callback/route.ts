import { NextResponse } from 'next/server'
import { exchangeCode } from '../../../lib/fitbit'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/game?gfit_error=denied`)
  }

  try {
    const tokens = await exchangeCode(code)
    const response = NextResponse.redirect(`${baseUrl}/game`)

    response.cookies.set('gfit_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    response.cookies.set('gfit_connected', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.redirect(`${baseUrl}/game?gfit_error=token_failed`)
  }
}
