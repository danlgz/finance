'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Household {
  id: string;
  name: string;
  users: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const response = await fetch('/api/households');
        if (!response.ok) {
          throw new Error('Failed to fetch households');
        }
        const data = await response.json();
        setHouseholds(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching households:', error);
        setError('Failed to load households');
        setIsLoading(false);
      }
    };

    fetchHouseholds();
  }, []);

  const handleCreateHousehold = () => {
    router.push('/households/create');
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
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Households</h1>
        <Button onClick={handleCreateHousehold}>Create Household</Button>
      </div>

      {households.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {households.map((household) => (
            <div
              key={household.id}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-card text-card-foreground shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-foreground">
                  {household.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {household.users.length} member{household.users.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Members:</h4>
                    <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                      {household.users.map((user) => (
                        <li key={user.id} className="flex justify-between py-2">
                          <div className="text-sm font-medium text-foreground">
                            {user.user.name || user.user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.role}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/households/${household.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/households/${household.id}/invite`)}
                    >
                      Invite Member
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No households found. Create your first household!</p>
          <div className="mt-4">
            <Button onClick={handleCreateHousehold}>Create Household</Button>
          </div>
        </div>
      )}
    </div>
  );
} 