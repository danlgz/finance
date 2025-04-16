'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslate } from '@/hooks/useTranslate';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { t, changeLanguage } = useTranslate();
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    language: ''
  });

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      loadProfile();
    }
  }, [status, session?.user?.id]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      console.log(data);
      setFormData({
        name: data.name || '',
        language: data.language || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(t('common:errorFetchingData'));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (value: string) => {
    setFormData((prev) => ({ ...prev, language: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (session && update) {
        await update({
          user: {
            ...session.user!,
            name: data.name,
          },
        });
      }

      await changeLanguage(data.language);
      
      toast.success(t('common:saved'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('common:errorSavingData'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">{t('common:loading')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('profile:title')}</h1>
        <Button 
          variant="outline" 
          onClick={loadProfile}
          disabled={isLoading}
        >
          {t('common:refresh')}
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-100 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('profile:personalInfo')}</CardTitle>
            <CardDescription>
              {t('profile:title')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile:name')}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile:email')}</Label>
              <Input
                id="email"
                type="email"
                value={session.user.email || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('profile:language')}</Label>
              <Select 
                value={formData.language} 
                onValueChange={handleLanguageChange}
                disabled={isLoading}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t('profile:language')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('profile:languages.en')}</SelectItem>
                  <SelectItem value="es">{t('profile:languages.es')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? t('common:saving') : t('profile:updateProfile')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 