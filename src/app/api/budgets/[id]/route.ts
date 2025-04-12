import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// GET - Get a specific budget by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: params.id,
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            users: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        categories: {
          include: {
            items: {
              include: {
                expenses: true,
              },
            },
          },
        },
      },
    });

    // Check if budget exists
    if (!budget) {
      return NextResponse.json({ message: 'Budget not found' }, { status: 404 });
    }

    // Check if user is a member of the household
    if (budget.household.users.length === 0) {
      return NextResponse.json(
        { message: 'You do not have access to this budget' },
        { status: 403 }
      );
    }

    // Get income for the same month/year
    const income = await prisma.income.findMany({
      where: {
        householdId: budget.householdId,
        date: {
          gte: new Date(budget.year, budget.month - 1, 1),
          lt: new Date(budget.year, budget.month, 1),
        },
      },
      include: {
        incomeCategory: true,
      },
    });

    return NextResponse.json({
      ...budget,
      incomeData: income,
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

interface BudgetCategory {
  id?: string;
  name: string;
  items: BudgetItem[];
}

interface BudgetItem {
  id?: string;
  name: string;
  amount: number;
  categoryId?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const budgetId = params.id;
    const data = await request.json();

    // Verify the budget exists and the user has access to it
    const existingBudget = await prisma.budget.findUnique({
      where: {
        id: budgetId,
      },
      include: {
        household: {
          select: {
            users: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ message: 'Budget not found' }, { status: 404 });
    }

    if (existingBudget.household.users.length === 0) {
      return NextResponse.json(
        { message: 'You do not have access to this budget' },
        { status: 403 }
      );
    }

    // Update the budget in a transaction
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // 1. Update basic budget info
      const updatedBudget = await tx.budget.update({
        where: { id: budgetId },
        data: {
          name: data.name,
          month: parseInt(data.month),
          year: parseInt(data.year),
          currency: data.currency,
          householdId: data.householdId,
        },
      });

      // 2. Process categories and items
      // First, get existing categories to determine which to delete
      const existingCategories = await tx.expenseCategory.findMany({
        where: { budgetId },
        include: { items: true },
      });

      // Create a map of existing categories by ID
      const existingCategoryMap = new Map(
        existingCategories.map((cat: { id: string }) => [cat.id, cat])
      );

      // Process each category in the request
      for (const category of data.categories as BudgetCategory[]) {
        let categoryId: string;

        if (category.id) {
          // Update existing category
          const updatedCategory = await tx.expenseCategory.update({
            where: { id: category.id },
            data: { name: category.name },
          });
          categoryId = updatedCategory.id;

          // Remove from map to track deletion
          existingCategoryMap.delete(category.id);
        } else {
          // Create new category
          const newCategory = await tx.expenseCategory.create({
            data: {
              name: category.name,
              budgetId,
              householdId: data.householdId,
            },
          });
          categoryId = newCategory.id;
        }

        // Get existing items for this category to determine which to delete
        const existingItems = category.id
          ? await tx.expenseItem.findMany({
              where: { categoryId: category.id },
            })
          : [];

        // Create a map of existing items by ID
        const existingItemMap = new Map(
          existingItems.map((item: { id: string }) => [item.id, item])
        );

        // Process each item in the category
        for (const item of category.items) {
          if (item.id) {
            // Update existing item
            await tx.expenseItem.update({
              where: { id: item.id },
              data: {
                name: item.name,
                amount: item.amount,
              },
            });

            // Remove from map to track deletion
            existingItemMap.delete(item.id);
          } else {
            // Create new item
            await tx.expenseItem.create({
              data: {
                name: item.name,
                amount: item.amount,
                categoryId,
                householdId: data.householdId,
              },
            });
          }
        }

        // Delete items that weren't in the request
        for (const itemId of existingItemMap.keys()) {
          await tx.expenseItem.delete({
            where: { id: itemId },
          });
        }
      }

      // Delete categories that weren't in the request
      for (const categoryId of existingCategoryMap.keys()) {
        // Delete all items first (cascade not handled automatically in Prisma)
        await tx.expenseItem.deleteMany({
          where: { categoryId },
        });

        // Then delete the category
        await tx.expenseCategory.delete({
          where: { id: categoryId },
        });
      }

      return updatedBudget;
    });

    return NextResponse.json({ 
      message: 'Budget updated successfully',
      budget: result
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 