'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslate } from '@/hooks/useTranslate';

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
  const { t } = useTranslate();
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

  if (households.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">{t('budgets:title')}</h1>
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('budgets:needHousehold')}</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/households/create')}>
              {t('budgets:createHousehold')}
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
      <h1 className="text-3xl font-bold mb-8">{t('budgets:title')}</h1>

      <div className="mb-6">
        <label htmlFor="householdSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('budgets:selectHousehold')}
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

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('budgets:budgetList')}</h2>
        <Button onClick={handleCreateBudget}>{t('budgets:createBudget')}</Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-card-foreground shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6">
                  {budget.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`budgets:month_${budget.month}`)} {budget.year}
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleViewBudget(budget.id)}
                  >
                    {t('budgets:viewDetails')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('budgets:noBudgetsFound')}</p>
          <div className="mt-4">
            <Button onClick={handleCreateBudget}>{t('budgets:createBudget')}</Button>
          </div>
        </div>
      )}
    </div>
  );
} 