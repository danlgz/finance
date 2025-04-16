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

export default function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslate();
  const router = useRouter();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const { id } = use(params);

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 