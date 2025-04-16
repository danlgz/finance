'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslate } from '@/hooks/useTranslate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Plus, PiggyBank } from 'lucide-react';
import { BudgetSummaryTable } from '@/components/budgets/BudgetSummaryTable';
import React from 'react';
import { ExpensesTable } from "@/components/expenses/ExpensesTable";

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  itemId: string;
}

interface Category {
  id: string;
  name: string;
  budgetedAmount: number;
  expenses: Expense[];
  items: {
    id: string;
    name: string;
    amount: number;
    expenses: Expense[];
  }[];
}

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  currency: string;
  householdId: string;
  household: {
    id: string;
    name: string;
  };
  categories: Category[];
  incomeAmount: number;
}

interface Household {
  id: string;
  name: string;
}

interface BudgetStats {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  categoryData: {
    name: string;
    value: number;
    spent: number;
  }[];
  expensesByCategory: {
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
  }[];
}

export default function DashboardPage() {
  const { t } = useTranslate();
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const response = await fetch('/api/households');
        if (!response.ok) throw new Error('Failed to fetch households');
        const data = await response.json();
        setHouseholds(data);
        if (data.length > 0) {
          setSelectedHouseholdId(data[0].id);
        }
      } catch {
        setError('Failed to load households');
      }
    };

    if (status === 'authenticated') {
      fetchHouseholds();
    }
  }, [status]);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!selectedHouseholdId) return;
      try {
        const response = await fetch(`/api/budgets?householdId=${selectedHouseholdId}`);
        if (!response.ok) throw new Error('Failed to fetch budgets');
        const data = await response.json();
        setBudgets(data);
        
        // Find current month and year budget
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = currentDate.getFullYear();
        
        const currentBudget = data.find(
          (budget: Budget) => budget.month === currentMonth && budget.year === currentYear
        );
        
        if (currentBudget) {
          setSelectedBudgetId(currentBudget.id);
        } else if (data.length > 0) {
          // If no current month budget, select the most recent one
          const sortedBudgets = [...data].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
          setSelectedBudgetId(sortedBudgets[0].id);
        } else {
          // No budgets found, set loading to false
          setIsLoading(false);
        }
      } catch {
        setError('Failed to load budgets');
        setIsLoading(false);
      }
    };

    if (selectedHouseholdId) {
      fetchBudgets();
    }
  }, [selectedHouseholdId]);

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      if (!selectedBudgetId) return;
      try {
        const response = await fetch(`/api/budgets/${selectedBudgetId}`);
        if (!response.ok) throw new Error('Failed to fetch budget details');
        const data = await response.json();
        setCurrentBudget(data);
        setIsLoading(false);
      } catch {
        setError('Failed to load budget details');
        setIsLoading(false);
      }
    };

    if (selectedBudgetId) {
      fetchBudgetDetails();
    }
  }, [selectedBudgetId]);

  const calculateBudgetStats = (budget: Budget): BudgetStats => {
    const totalBudgeted = budget.categories.reduce((sum, category) => {
      const itemsBudgeted = category.items.reduce((itemSum, item) => itemSum + item.amount, 0);
      return sum + itemsBudgeted;
    }, 0);

    const totalSpent = budget.categories.reduce((sum, category) => {
      const itemExpenses = category.items.reduce((itemSum, item) => {
        return itemSum + (item.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0);
      }, 0);
      return sum + itemExpenses;
    }, 0);

    const remaining = totalBudgeted - totalSpent;

    const categoryData = budget.categories.map(category => {
      const budgeted = category.items.reduce((sum, item) => sum + item.amount, 0);
      const spent = category.items.reduce((sum, item) => {
        return sum + (item.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0);
      }, 0);
      
      return {
        name: category.name,
        value: budgeted,
        spent
      };
    });

    const expensesByCategory = budget.categories.map(category => {
      const budgeted = category.items.reduce((sum, item) => sum + item.amount, 0);
      const spent = category.items.reduce((sum, item) => {
        return sum + (item.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0);
      }, 0);
      
      return {
        name: category.name,
        budgeted,
        spent,
        remaining: budgeted - spent
      };
    });

    return {
      totalBudgeted,
      totalSpent,
      remaining,
      categoryData,
      expensesByCategory
    };
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xl">{t('common:loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('common:error')}</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!households.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <PiggyBank className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('dashboard:no_households')}</h2>
        <p className="text-gray-500 mb-4">{t('dashboard:create_household_to_start')}</p>
        <Button onClick={() => router.push('/households/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('dashboard:create_household')}
        </Button>
      </div>
    );
  }

  const stats = currentBudget ? calculateBudgetStats(currentBudget) : null;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('common:dashboard')}</h1>
        <div className="flex gap-4">
          <Select
            value={selectedHouseholdId || ''}
            onValueChange={(value) => setSelectedHouseholdId(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('common:selectHousehold')} />
            </SelectTrigger>
            <SelectContent>
              {households.map((household) => (
                <SelectItem key={household.id} value={household.id}>
                  {household.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {budgets.length > 0 && (
            <Select
              value={selectedBudgetId || ''}
              onValueChange={(value) => setSelectedBudgetId(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('common:selectBudget')} />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!currentBudget && budgets.length === 0 && selectedHouseholdId && (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <PiggyBank className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">{t('dashboard:noBudgetsTitle')}</h2>
          <p className="text-muted-foreground text-center">{t('dashboard:noBudgetsDescription')}</p>
          <Button onClick={() => router.push(`/budgets/create?householdId=${selectedHouseholdId}`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard:createBudget')}
          </Button>
        </div>
      )}

      {currentBudget && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('budgets:totalBudgeted')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalBudgeted, currentBudget.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('budgets:totalSpent')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalSpent, currentBudget.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard:remaining_budget')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.remaining, currentBudget.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>{t('dashboard:budget_breakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {stats.categoryData.map((entry, index) => {
                          const colors = [
                            '#ef4444',
                            '#eab308',
                            '#22c55e',
                            '#3b82f6',
                            '#a855f7',
                            '#ec4899'
                          ];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number, currentBudget.currency)}
                        labelFormatter={(label) => t(`categories:${label}`)}
                      />
                      <Legend formatter={(value) => t(`categories:${value}`)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t('dashboard:expenses_by_category')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.expensesByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tickFormatter={(value) => t(`categories:${value}`)}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value, currentBudget.currency)} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number, currentBudget.currency)}
                        labelFormatter={(label) => t(`categories:${label}`)}
                      />
                      <Legend />
                      <Bar dataKey="budgeted" name={t('dashboard:budgeted')} fill="#8884d8" />
                      <Bar dataKey="spent" name={t('dashboard:spent')} fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
              <BudgetSummaryTable
                categories={currentBudget.categories}
                currency={currentBudget.currency}
                t={t}
              />

              <ExpensesTable
                expenses={currentBudget.categories.flatMap(category => 
                  category.items.flatMap(item => 
                    item.expenses.map(expense => ({
                      ...expense,
                      categoryId: category.id,
                      itemId: item.id
                    }))
                  )
                )}
                categories={currentBudget.categories}
                currency={currentBudget.currency}
                t={t}
              />
          </div>
        </>
      )}

      {!currentBudget && budgets.length > 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{t('dashboard:selectBudgetToView')}</p>
        </div>
      )}

      {selectedHouseholdId && budgets.length > 0 && (
        <Button
          className="fixed bottom-4 right-4 shadow-lg"
          onClick={() => router.push(`/expenses/create?budgetId=${selectedBudgetId}`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('expenses:addExpense')}
        </Button>
      )}
    </div>
  );
}