import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true }
    })

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
