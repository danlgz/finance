'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Household {
  id: string;
  name: string;
}

export default function CreateBudgetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedHouseholdId = searchParams.get('householdId');

  const [name, setName] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // Current month (1-12)
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [householdId, setHouseholdId] = useState<string>(preselectedHouseholdId || '');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // If no household is preselected and we have households, select the first one
        if (!preselectedHouseholdId && data.length > 0) {
          setHouseholdId(data[0].id);
        }
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Error fetching households:', error);
        setError('Failed to load households');
        setIsInitialLoading(false);
      }
    };

    fetchHouseholds();
  }, [preselectedHouseholdId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          month,
          year,
          householdId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create budget');
      }

      router.push('/budgets');
      router.refresh();
    } catch (error) {
      console.error('Error creating budget:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (households.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Create New Budget</h1>
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

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Generate year options (current year +/- 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => ({
    value: currentYear - 5 + i,
    label: String(currentYear - 5 + i),
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create New Budget</h1>

      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Budget Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Monthly Budget"
                minLength={2}
              />
            </div>
          </div>

          <div>
            <label htmlFor="householdSelect" className="block text-sm font-medium text-gray-700">
              Household
            </label>
            <select
              id="householdSelect"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Select a household</option>
              {households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700">
                Month
              </label>
              <select
                id="monthSelect"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {monthOptions.map((monthOption) => (
                  <option key={monthOption.value} value={monthOption.value}>
                    {monthOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="yearSelect"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption.value} value={yearOption.value}>
                    {yearOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
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
          )}

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Budget'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/budgets')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 