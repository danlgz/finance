import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

// Schema for household update
const householdUpdateSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
});

// GET - Get a specific household
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const household = await prisma.household.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(household);
  } catch (error) {
    console.error('Error fetching household:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a household
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = householdUpdateSchema.parse(body);

    const household = await prisma.household.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    const updatedHousehold = await prisma.household.update({
      where: {
        id: params.id,
      },
      data: {
        name,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedHousehold);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating household:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a household
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const household = await prisma.household.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    await prisma.household.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting household:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 