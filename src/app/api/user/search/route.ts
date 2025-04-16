import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || email.length < 3) {
      return NextResponse.json({ error: 'email required (min 3 chars)' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
        NOT: {
          id: session.user.id, // exclude current user
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 5, // limit results
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
} 