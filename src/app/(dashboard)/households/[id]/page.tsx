'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useTranslate } from '@/hooks/useTranslate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface UserResult {
  id: string;
  name?: string;
  email: string;
}

export default function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslate();
  const router = useRouter();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const { id } = use(params);

  // hooks y estados para búsqueda y agregar usuario
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);

  useEffect(() => {
    const fetchHousehold = async () => {
      try {
        const response = await fetch(`/api/households/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch household');
        }
        const data = await response.json();
        setHousehold(data);
        setEditedName(data.name);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching household:', error);
        setError('Failed to load household');
        setIsLoading(false);
      }
    };

    fetchHousehold();
  }, [id]);

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      const response = await fetch(`/api/households/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update household');
      }

      const data = await response.json();
      setHousehold(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating household:', error);
      setError('Failed to update household');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('households:confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/households/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete household');
      }

      router.push('/households');
      router.refresh();
    } catch (error) {
      console.error('Error deleting household:', error);
      setError('Failed to delete household');
    }
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

  if (!household) {
    return null;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('households:householdDetails')}</h1>
        <div className="flex space-x-3">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={handleEdit}
          >
            {isEditing ? t('common:save') : t('common:edit')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            {t('common:delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('households:householdInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('households:householdName')}</Label>
            {isEditing ? (
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={t('households:householdNamePlaceholder')}
              />
            ) : (
              <p className="text-lg">{household.name}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">{t('households:members')}</h3>
            <div className="space-y-4">
              {household.users.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.user.name || user.user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-2">{t('households:addMember')}</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSearchError(null);
                  setSearchResult(null);
                  setAddError(null);
                  setAddSuccess(null);
                  if (!searchEmail) return;
                  setIsSearching(true);
                  try {
                    const res = await fetch(`/api/user/search?email=${encodeURIComponent(searchEmail)}`);
                    if (!res.ok) {
                      throw new Error('not found');
                    }
                    const user = await res.json();
                    setSearchResult(user);
                  } catch {
                    setSearchError(t('households:userNotFound'));
                  } finally {
                    setIsSearching(false);
                  }
                }}
                className="flex flex-col gap-2"
              >
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={t('households:searchByEmail')}
                    value={searchEmail || ''}
                    onChange={async e => {
                      setSearchEmail(e.target.value);
                      setSearchError(null);
                      setAddError(null);
                      setAddSuccess(null);
                      setSearchResult(null);
                      if (e.target.value.length < 3) {
                        setSuggestions([]);
                        return;
                      }
                      setIsSearching(true);
                      try {
                        const res = await fetch(`/api/user/search?email=${encodeURIComponent(e.target.value)}`);
                        if (!res.ok) {
                          setSuggestions([]);
                          return;
                        }
                        const users = await res.json();
                        setSuggestions(Array.isArray(users) ? users : [users]);
                      } catch {
                        setSuggestions([]);
                      } finally {
                        setIsSearching(false);
                      }
                    }}
                    autoComplete="off"
                    required
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full mt-1 rounded shadow max-h-48 overflow-y-auto">
                      {suggestions.map((user: UserResult) => (
                        <li
                          key={user.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            setSearchResult(user);
                            setSearchEmail(user.email);
                            setSuggestions([]);
                          }}
                        >
                          {user.name ? `${user.name} (${user.email})` : user.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button type="submit" disabled={isSearching}>{isSearching ? t('common:loading') : t('households:search')}</Button>
                {searchError && <p className="text-red-500 text-sm">{searchError}</p>}
              </form>
              {searchResult && (
                <div className="mt-2 flex items-center gap-2">
                  <span>{searchResult.name || searchResult.email}</span>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setAddError(null);
                      setAddSuccess(null);
                      setIsAdding(true);
                      try {
                        const res = await fetch(`/api/households/${id}/add-user`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: searchResult.id }),
                        });
                        if (!res.ok) throw new Error('error');
                        setAddSuccess(t('households:userAdded'));
                        setSearchResult(null);
                        setSearchEmail('');
                        // refresh household
                        const response = await fetch(`/api/households/${id}`);
                        const data = await response.json();
                        setHousehold(data);
                      } catch {
                        setAddError(t('households:addUserError'));
                      } finally {
                        setIsAdding(false);
                      }
                    }}
                    disabled={isAdding}
                  >
                    {isAdding ? t('common:loading') : t('households:add')}
                  </Button>
                  {addError && <span className="text-red-500 text-sm">{addError}</span>}
                  {addSuccess && <span className="text-green-600 text-sm">{addSuccess}</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 