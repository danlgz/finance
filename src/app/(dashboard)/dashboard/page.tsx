'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  householdId: string;
  currency: string;
  categories: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      amount: number;
    }[];
  }[];
}

interface Household {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        } catch (error) {
          console.error('Error fetching budgets:', error);
          setError('Failed to load budgets');
        }
      };

      fetchBudgets();
    }
  }, [selectedHouseholdId]);

  const handleCreateBudget = () => {
    router.push('/budgets/create');
  };

  const handleViewBudget = (budgetId: string) => {
    router.push(`/budgets/${budgetId}`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
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
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || 'User'}!
        </p>
      </div>

      {households.length > 0 ? (
        <>
          <div className="mb-6">
            <label htmlFor="householdSelect" className="block text-sm font-medium text-foreground">
              Select Household
            </label>
            <select
              id="householdSelect"
              value={selectedHouseholdId || ''}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              {households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Budgets</h2>
              <Button onClick={handleCreateBudget}>
                Create Budget
              </Button>
            </div>
          </div>

          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'
                ];
                
                const monthName = monthNames[budget.month - 1];
                
                return (
                  <div 
                    key={budget.id} 
                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-card-foreground shadow"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-foreground">
                        {budget.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {monthName} {budget.year}
                      </p>
                      <div className="mt-4">
                        <Button 
                          variant="secondary"
                          onClick={() => handleViewBudget(budget.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No budgets yet. Create your first budget!</p>
              <div className="mt-4">
                <Button onClick={handleCreateBudget}>
                  Create Budget
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No households found. Create your first household!</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/households/create')}>
              Create Household
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}