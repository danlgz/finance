import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    if (!body.language || !['en', 'es'].includes(body.language)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        language: body.language,
      },
    });
    
    return NextResponse.json({
      language: user.language,
    });
  } catch (error) {
    console.error('Error updating user language:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 