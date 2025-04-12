'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslate } from '@/hooks/useTranslate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { CalendarDays, CreditCard, DollarSign, PiggyBank, Plus } from 'lucide-react';

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  expenses: {
    id: string;
    amount: number;
    description: string;
    date: string;
  }[];
}

interface Category {
  id: string;
  name: string;
  items: BudgetItem[];
}

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  householdId: string;
  currency: string;
  categories: Category[];
}

interface Household {
  id: string;
  name: string;
}

interface CategoryData {
  name: string;
  value: number;
  spent: number;
}

interface ExpenseByCategoryData {
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

interface BudgetStats {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  categoryData: CategoryData[];
  expensesByCategory: ExpenseByCategoryData[];
}

export default function DashboardPage() {
  const { t } = useTranslate();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the current date for default selection
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch households
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchHouseholds = async () => {
        try {
          const response = await fetch('/api/households');
          if (!response.ok) {
            throw new Error('Failed to fetch households');
          }
          const data = await response.json();
          setHouseholds(data);
          
          if (data.length > 0) {
            setSelectedHouseholdId(data[0].id);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching households:', error);
          setError('Failed to load households');
          setIsLoading(false);
        }
      };

      fetchHouseholds();
    }
  }, [status]);

  // Fetch budgets when household is selected
  useEffect(() => {
    if (selectedHouseholdId) {
      const fetchBudgets = async () => {
        try {
          const response = await fetch(`/api/budgets?householdId=${selectedHouseholdId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch budgets');
          }
          const data = await response.json();
          setBudgets(data);
          
          // Find current month's budget, or the most recent one
          const currentMonthBudget = data.find(
            (budget: Budget) => budget.month === currentMonth && budget.year === currentYear
          );
          
          // If no budget exists for the current month, get the most recent
          if (currentMonthBudget) {
            setSelectedBudgetId(currentMonthBudget.id);
          } else if (data.length > 0) {
            // Sort by year then month, descending
            const sortedBudgets = [...data].sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            });
            setSelectedBudgetId(sortedBudgets[0].id);
          } else {
            setSelectedBudgetId(null);
          }
        } catch (error) {
          console.error('Error fetching budgets:', error);
          setError('Failed to load budgets');
        }
      };

      fetchBudgets();
    }
  }, [selectedHouseholdId, currentMonth, currentYear]);

  // Fetch budget details when a budget is selected
  useEffect(() => {
    if (selectedBudgetId) {
      const fetchBudgetDetails = async () => {
        try {
          const response = await fetch(`/api/budgets/${selectedBudgetId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch budget details');
          }
          const data = await response.json();
          setCurrentBudget(data);
        } catch (error) {
          console.error('Error fetching budget details:', error);
          setError('Failed to load budget details');
        }
      };

      fetchBudgetDetails();
    }
  }, [selectedBudgetId]);

  const handleCreateBudget = () => {
    router.push('/budgets/create');
  };

  const handleViewBudgetDetails = () => {
    if (selectedBudgetId) {
      router.push(`/budgets/${selectedBudgetId}`);
    }
  };

  const handleEditBudget = () => {
    if (selectedBudgetId) {
      router.push(`/budgets/${selectedBudgetId}/edit`);
    }
  };

  // Calculate budget statistics
  const calculateBudgetStats = (): BudgetStats => {
    if (!currentBudget) return { 
      totalBudgeted: 0, 
      totalSpent: 0, 
      remaining: 0, 
      categoryData: [], 
      expensesByCategory: [] 
    };
    
    let totalBudgeted = 0;
    let totalSpent = 0;
    const categoryData: CategoryData[] = [];
    const expensesByCategory: ExpenseByCategoryData[] = [];
    
    currentBudget.categories.forEach(category => {
      const categoryBudgeted = category.items.reduce((sum, item) => sum + item.amount, 0);
      const categorySpent = category.items.reduce((sum, item) => {
        return sum + (item.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0);
      }, 0);
      
      totalBudgeted += categoryBudgeted;
      totalSpent += categorySpent;
      
      categoryData.push({
        name: category.name,
        value: categoryBudgeted,
        spent: categorySpent
      });
      
      expensesByCategory.push({
        name: category.name,
        budgeted: categoryBudgeted,
        spent: categorySpent,
        remaining: categoryBudgeted - categorySpent
      });
    });
    
    return {
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
      categoryData,
      expensesByCategory
    };
  };

  const stats = calculateBudgetStats();
  
  // Define colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      </div>
    );
  }

  if (households.length === 0) {
    // No households, prompt to create one
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('dashboard:title')}</h1>
          <p className="text-muted-foreground">
            {t('common:welcome', { name: session?.user?.name || 'User' })}
          </p>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('dashboard:noHouseholdsFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('budgets:needHousehold')}
            </p>
            <Button onClick={() => router.push('/households/create')}>
              {t('households:createHousehold')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard:title')}</h1>
        <p className="text-muted-foreground">
          {t('common:welcome', { name: session?.user?.name || 'User' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 mb-6">
        <div className="md:col-span-6">
          <label className="text-sm font-medium text-muted-foreground">{t('dashboard:selectHousehold')}</label>
          <Select
            value={selectedHouseholdId || ''}
            onValueChange={(value) => setSelectedHouseholdId(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('dashboard:selectHousehold')} />
            </SelectTrigger>
            <SelectContent>
              {households.map((household) => (
                <SelectItem key={household.id} value={household.id}>
                  {household.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-6">
          <label className="text-sm font-medium text-muted-foreground">{t('common:budgets')}</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <Select
                value={selectedBudgetId || ''}
                onValueChange={(value) => setSelectedBudgetId(value)}
                disabled={budgets.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('budgets:selectBudget')} />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {t(`budgets:month_${budget.month}`)} {budget.year} - {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateBudget} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {currentBudget ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('budgets:totalBudgeted')}
                  </CardTitle>
                  <CardDescription>
                    {t(`budgets:month_${currentBudget.month}`)} {currentBudget.year}
                  </CardDescription>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalBudgeted, currentBudget.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('budgets:totalSpent')}
                  </CardTitle>
                  <CardDescription>
                    {t('common:currentSpending')}
                  </CardDescription>
                </div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalSpent, currentBudget.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('budgets:remaining')}
                  </CardTitle>
                  <CardDescription>
                    {t('common:availableFunds')}
                  </CardDescription>
                </div>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {formatCurrency(stats.remaining, currentBudget.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{t('dashboard:budgetBreakdown')}</CardTitle>
                <CardDescription>
                  {t('dashboard:budgetAllocation')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currentBudget.currency)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{t('dashboard:spendingByCategory')}</CardTitle>
                <CardDescription>
                  {t('dashboard:budgetedVsSpent')}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.expensesByCategory}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, currentBudget.currency)}
                    />
                    <Legend />
                    <Bar dataKey="budgeted" fill="#8884d8" name={t('budgets:budgeted')} />
                    <Bar dataKey="spent" fill="#82ca9d" name={t('budgets:spent')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('budgets:budgetSummary')}</CardTitle>
              <CardDescription>
                {t('budgets:overview')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('budgets:category')}</th>
                      <th className="text-right py-2">{t('budgets:budgeted')}</th>
                      <th className="text-right py-2">{t('budgets:spent')}</th>
                      <th className="text-right py-2">{t('budgets:remaining')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.expensesByCategory.map((category, index) => (
                      <tr key={index} className="border-b hover:bg-secondary/20">
                        <td className="py-2">{category.name}</td>
                        <td className="text-right py-2">{formatCurrency(category.budgeted, currentBudget.currency)}</td>
                        <td className="text-right py-2">{formatCurrency(category.spent, currentBudget.currency)}</td>
                        <td className={`text-right py-2 ${category.remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {formatCurrency(category.remaining, currentBudget.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="py-2">{t('budgets:total')}</td>
                      <td className="text-right py-2">{formatCurrency(stats.totalBudgeted, currentBudget.currency)}</td>
                      <td className="text-right py-2">{formatCurrency(stats.totalSpent, currentBudget.currency)}</td>
                      <td className={`text-right py-2 ${stats.remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatCurrency(stats.remaining, currentBudget.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleViewBudgetDetails}>
                {t('budgets:viewDetails')}
              </Button>
              <Button onClick={handleEditBudget}>
                {t('budgets:editBudget')}
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : budgets.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('dashboard:selectBudgetPrompt')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('dashboard:selectBudgetToView')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('dashboard:noBudgetsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('dashboard:createBudgetPrompt')}
            </p>
            <Button onClick={handleCreateBudget}>
              {t('budgets:createBudget')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}