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

interface ProfileData {
  id: string;
  name: string;
  email: string;
  language: string;
}

export default function ProfilePage() {
  const { t, language, changeLanguage } = useTranslate();
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    language: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfileData(data);
        setFormData({
          name: data.name || '',
          language: data.language || 'en'
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchProfile();
    } else {
      router.push('/login');
    }
  }, [session?.user?.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, language: value }));
    await changeLanguage(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      setProfileData(data);

      // Update session
      if (session?.user) {
        await updateSession({
          user: {
            ...session.user,
            name: data.name,
          },
        });
      }

      toast.success(t('profile:profileUpdated'));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">{t('common:loading')}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">{t('common:error')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t('profile:title')}</h1>
      
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile:email')}</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('profile:language')}</Label>
              <Select 
                value={formData.language} 
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t('profile:language')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('profile:english')}</SelectItem>
                  <SelectItem value="es">{t('profile:spanish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">{t('profile:updateProfile')}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 