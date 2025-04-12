import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener gastos con filtros (por household, budget, etc)
export async function GET(request: NextRequest) {
  try {
    // Verificar si el usuario está autenticado
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');
    const budgetId = searchParams.get('budgetId');
    const categoryId = searchParams.get('categoryId');
    const itemId = searchParams.get('itemId');

    // Construir consulta de filtro
    const filter: any = {};

    if (householdId) {
      filter.householdId = householdId;
    }

    if (itemId) {
      filter.expenseItemId = itemId;
    }

    // Verificar acceso al household
    if (householdId) {
      const household = await prisma.household.findUnique({
        where: {
          id: householdId,
        },
        include: {
          users: {
            where: {
              userId: session.user.id,
            },
          },
        },
      });

      if (!household || household.users.length === 0) {
        return NextResponse.json(
          { message: 'You do not have access to this household' },
          { status: 403 }
        );
      }
    }

    // Búsqueda adicional por categoría o presupuesto
    let additionalFilter = {};
    if (budgetId || categoryId) {
      // Si se especificó una categoría o un presupuesto, necesitamos hacer un join
      if (budgetId) {
        // Obtener el mes y año del presupuesto para filtrar los gastos
        const budget = await prisma.budget.findUnique({
          where: { id: budgetId }
        });

        if (!budget) {
          return NextResponse.json({ message: 'Budget not found' }, { status: 404 });
        }

        // Filtrar gastos por el mismo mes y año que el presupuesto
        additionalFilter = {
          date: {
            gte: new Date(budget.year, budget.month - 1, 1),
            lt: new Date(budget.year, budget.month, 0)
          }
        };
      }

      if (categoryId) {
        // Filtrar gastos por categoría
        additionalFilter = {
          ...additionalFilter,
          expenseItem: {
            categoryId: categoryId
          }
        };
      }
    }

    // Buscar gastos
    const expenses = await prisma.expense.findMany({
      where: {
        ...filter,
        ...additionalFilter
      },
      include: {
        expenseItem: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo gasto
export async function POST(request: NextRequest) {
  try {
    // Verificar si el usuario está autenticado
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { description, amount, date, expenseItemId, householdId } = data;

    // Verificar datos requeridos
    if (!expenseItemId || !householdId || !amount || !date) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar acceso al household
    const household = await prisma.household.findUnique({
      where: {
        id: householdId,
      },
      include: {
        users: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!household || household.users.length === 0) {
      return NextResponse.json(
        { message: 'You do not have access to this household' },
        { status: 403 }
      );
    }

    // Verificar que el item existe y pertenece al household correcto
    const expenseItem = await prisma.expenseItem.findUnique({
      where: {
        id: expenseItemId,
      }
    });

    if (!expenseItem || expenseItem.householdId !== householdId) {
      return NextResponse.json(
        { message: 'Invalid expense item' },
        { status: 400 }
      );
    }

    // Crear el gasto
    const expense = await prisma.expense.create({
      data: {
        description: description || '',
        amount: parseFloat(amount),
        date: new Date(date),
        expenseItemId,
        householdId,
      },
      include: {
        expenseItem: {
          include: {
            category: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 