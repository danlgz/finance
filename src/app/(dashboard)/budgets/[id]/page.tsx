'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  expenses: {
    id: string;
    amount: number;
    description: string | null;
    date: string;
  }[];
}

interface Category {
  id: string;
  name: string;
  items: ExpenseItem[];
}

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  currency: string;
  household: {
    id: string;
    name: string;
  };
  categories: Category[];
  incomeData: {
    id: string;
    amount: number;
    description: string | null;
    date: string;
    incomeCategory: {
      id: string;
      name: string;
    };
  }[];
}

export default function BudgetDetailsPage({ params }: { params: { id: string } }) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await fetch(`/api/budgets/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Budget not found');
          } else if (response.status === 403) {
            throw new Error('You do not have access to this budget');
          } else {
            throw new Error('Failed to fetch budget');
          }
        }
        
        const data = await response.json();
        setBudget(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching budget details:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
        setIsLoading(false);
      }
    };

    fetchBudget();
  }, [params.id]);

  // Calculate totals for budget
  const calculateTotals = () => {
    if (!budget) return { 
      budgeted: 0, 
      spent: 0, 
      remaining: 0, 
      totalIncome: 0,
      incomeRemaining: 0
    };

    // Calculate budgeted amount
    let budgeted = 0;
    budget.categories.forEach(category => {
      category.items.forEach(item => {
        budgeted += item.amount;
      });
    });

    // Calculate spent amount
    let spent = 0;
    budget.categories.forEach(category => {
      category.items.forEach(item => {
        item.expenses.forEach(expense => {
          spent += expense.amount;
        });
      });
    });

    // Calculate total income
    let totalIncome = 0;
    budget.incomeData.forEach(income => {
      totalIncome += income.amount;
    });

    const remaining = budgeted - spent;
    const incomeRemaining = totalIncome - spent;

    return { 
      budgeted, 
      spent, 
      remaining, 
      totalIncome,
      incomeRemaining
    };
  };

  const totals = calculateTotals();

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'GTQ':
        return 'Q';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return '';
    }
  };

  // Format month name
  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="rounded-md bg-amber-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Budget not found</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>The requested budget could not be found.</p>
            </div>
            <div className="mt-4">
              <Button onClick={() => router.push('/budgets')}>
                Back to Budgets
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(budget.currency);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{budget.name}</h1>
          <p className="text-gray-600">
            {getMonthName(budget.month)} {budget.year} • {budget.household.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/budgets')}
          >
            Back to Budgets
          </Button>
          <Button
            onClick={() => router.push(`/budgets/${budget.id}/edit`)}
          >
            Edit Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Budgeted</p>
          <p className="text-2xl font-bold">{currencySymbol}{totals.budgeted.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-2xl font-bold">{currencySymbol}{totals.totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Spent</p>
          <p className="text-2xl font-bold">{currencySymbol}{totals.spent.toFixed(2)}</p>
        </div>
        <div className={`bg-white p-4 rounded-lg shadow ${totals.remaining < 0 ? 'bg-red-50' : ''}`}>
          <p className="text-sm text-gray-500">Budget Remaining</p>
          <p className={`text-2xl font-bold ${totals.remaining < 0 ? 'text-red-600' : ''}`}>
            {currencySymbol}{totals.remaining.toFixed(2)}
          </p>
        </div>
        <div className={`bg-white p-4 rounded-lg shadow ${totals.incomeRemaining < 0 ? 'bg-red-50' : ''}`}>
          <p className="text-sm text-gray-500">Income Remaining</p>
          <p className={`text-2xl font-bold ${totals.incomeRemaining < 0 ? 'text-red-600' : ''}`}>
            {currencySymbol}{totals.incomeRemaining.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Budget Categories</h2>
        
        {budget.categories.length > 0 ? (
          <div className="space-y-4">
            {budget.categories.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">{category.name}</h3>
                
                {category.items.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {category.items.map((item) => {
                          // Calculate total spent for this item
                          const itemSpent = item.expenses.reduce((total, expense) => total + expense.amount, 0);
                          const itemRemaining = item.amount - itemSpent;
                          
                          return (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{currencySymbol}{item.amount.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{currencySymbol}{itemSpent.toFixed(2)}</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${itemRemaining < 0 ? 'text-red-600' : ''}`}>
                                {currencySymbol}{itemRemaining.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/expenses/add?expenseItemId=${item.id}`)}
                                >
                                  Add Expense
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No items in this category</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-500">No categories found. Add categories to your budget!</p>
            <div className="mt-4">
              <Button onClick={() => router.push(`/budgets/${budget.id}/edit`)}>
                Edit Budget
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Income Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Income</h2>
        
        {budget.incomeData && budget.incomeData.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budget.incomeData.map((income) => (
                  <tr key={income.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{income.incomeCategory.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{income.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(income.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{currencySymbol}{income.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-500">No income recorded for this month</p>
            <div className="mt-4">
              <Button onClick={() => router.push(`/income/add?budgetId=${budget.id}`)}>
                Add Income
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 