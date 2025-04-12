'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Budget {
  id: string;
  name: string;
  month: number;
  year: number;
  currency: string;
}

interface Household {
  id: string;
  name: string;
}

export default function BudgetsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch households
  useEffect(() => {
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
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching households:', error);
        setError('Failed to load households');
        setIsLoading(false);
      }
    };

    fetchHouseholds();
  }, []);

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
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching budgets:', error);
          setError('Failed to load budgets');
          setIsLoading(false);
        }
      };

      fetchBudgets();
    }
  }, [selectedHouseholdId]);

  const handleCreateBudget = () => {
    if (selectedHouseholdId) {
      router.push(`/budgets/create?householdId=${selectedHouseholdId}`);
    }
  };

  const handleViewBudget = (budgetId: string) => {
    router.push(`/budgets/${budgetId}`);
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

  if (households.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Budgets</h1>
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-gray-500">You need to create a household first before creating budgets.</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/households/create')}>
              Create Household
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Budgets</h1>

      <div className="mb-6">
        <label htmlFor="householdSelect" className="block text-sm font-medium text-gray-700">
          Select Household
        </label>
        <select
          id="householdSelect"
          value={selectedHouseholdId || ''}
          onChange={(e) => setSelectedHouseholdId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budget List</h2>
        <Button onClick={handleCreateBudget}>Create Budget</Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {budget.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {monthNames[budget.month - 1]} {budget.year}
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
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-gray-500">No budgets found. Create your first budget!</p>
          <div className="mt-4">
            <Button onClick={handleCreateBudget}>Create Budget</Button>
          </div>
        </div>
      )}
    </div>
  );
} 