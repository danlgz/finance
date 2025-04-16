import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';

// Schema for household creation
const householdSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
});

// GET - Get all households for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const households = await prisma.household.findMany({
      where: {
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
      orderBy: {
        users: {
          _count: 'asc'
        }
      }
    });

    // Sort households based on the user's order preference
    const sortedHouseholds = await Promise.all(
      households.map(async (household) => {
        const userHousehold = await prisma.userHousehold.findFirst({
          where: {
            householdId: household.id,
            userId: session.user.id,
          },
          select: {
            order: true,
          },
        });
        return {
          ...household,
          userOrder: userHousehold?.order || 0,
        };
      })
    );

    sortedHouseholds.sort((a, b) => a.userOrder - b.userOrder);

    // Remove the temporary userOrder field before sending the response
    const cleanedHouseholds = sortedHouseholds.map(({ userOrder, ...household }) => household);

    return NextResponse.json(cleanedHouseholds);
  } catch (error) {
    console.error('Error fetching households:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new household
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = householdSchema.parse(body);

    const household = await prisma.household.create({
      data: {
        name,
        users: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating household:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 