import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';

// Schema for budget creation
const budgetSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  householdId: z.string().uuid(),
  currency: z.enum(['GTQ', 'USD', 'EUR']).optional(),
});

// GET - Get all budgets for a household
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json(
        { error: 'Household ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this household
    const userHousehold = await prisma.userHousehold.findFirst({
      where: {
        userId: session.user.id,
        householdId,
      },
    });

    if (!userHousehold) {
      return NextResponse.json(
        { error: 'You do not have access to this household' },
        { status: 403 }
      );
    }

    const budgets = await prisma.budget.findMany({
      where: {
        householdId,
      },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new budget
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
    const { name, month, year, householdId, currency } = budgetSchema.parse(body);

    // Check if user has access to this household
    const userHousehold = await prisma.userHousehold.findFirst({
      where: {
        userId: session.user.id,
        householdId,
      },
    });

    if (!userHousehold) {
      return NextResponse.json(
        { error: 'You do not have access to this household' },
        { status: 403 }
      );
    }

    // Check if budget already exists for this month/year in this household
    const existingBudget = await prisma.budget.findFirst({
      where: {
        householdId,
        month,
        year,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: 'A budget already exists for this month and year' },
        { status: 400 }
      );
    }

    // Create the budget
    const budget = await prisma.budget.create({
      data: {
        name,
        month,
        year,
        householdId,
        currency: currency || 'GTQ',
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 