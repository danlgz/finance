import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

// Schema for order update
const orderUpdateSchema = z.object({
  orders: z.array(z.object({
    householdId: z.string(),
    order: z.number(),
  })),
});

// PUT - Update household orders
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orders } = orderUpdateSchema.parse(body);

    // Update orders in transaction
    await prisma.$transaction(
      orders.map(({ householdId, order }) =>
        prisma.userHousehold.update({
          where: {
            userId_householdId: {
              userId: session.user.id,
              householdId,
            },
          },
          data: {
            order,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating household orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 