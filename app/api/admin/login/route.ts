import { NextResponse } from 'next/server';
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Username ug Password gikinahanglan.' },
        { status: 400 }
      );
    }

    const expectedUser = process.env.ADMIN_USERNAME || 'bestadmin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin12345';

    const isUserValid = safeCompare(username.trim(), expectedUser.trim());
    const isPassValid = safeCompare(password.trim(), expectedPass.trim());

    if (isUserValid && isPassValid) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      return NextResponse.json({
        success: true,
        message: 'Admin Authentication Successful',
        token: sessionToken
      });
    }

    return NextResponse.json(
      { success: false, message: 'Sayop ang Username o Password! Sulayi pag-usab.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
