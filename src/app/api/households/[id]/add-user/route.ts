import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    // check if household exists and user is owner or admin
    const household = await prisma.household.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            userId: session.user.id,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    });
    if (!household) {
      return NextResponse.json({ error: 'not found or no permission' }, { status: 404 });
    }
    // check if user is already in household
    const already = await prisma.userHousehold.findFirst({
      where: {
        householdId: params.id,
        userId,
      },
    });
    if (already) {
      return NextResponse.json({ error: 'user already in household' }, { status: 400 });
    }
    // add user as MEMBER
    const userHousehold = await prisma.userHousehold.create({
      data: {
        householdId: params.id,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, user: userHousehold.user });
  } catch (error) {
    console.error('Error adding user to household:', error);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
} 