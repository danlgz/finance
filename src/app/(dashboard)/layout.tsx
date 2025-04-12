'use client';

import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface UserInfo {
  name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, update: updateSession } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const fetchedRef = useRef(false);
  
  // Fetch latest user info from API
  useEffect(() => {
    // Prevent fetching if we've already done it or if there's no session
    if (fetchedRef.current || !session?.user?.id) return;
    
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUserInfo({
            name: data.name,
            email: data.email
          });
          
          // Only update session if values are different
          if (data.name !== session.user.name || data.email !== session.user.email) {
            await updateSession({
              user: {
                ...session.user,
                name: data.name,
                email: data.email
              }
            });
          }
          
          // Mark as fetched
          fetchedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    fetchUserInfo();
  }, [session?.user?.id]); // Only depend on the user ID, not the entire session object
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Budgets', href: '/budgets' },
    { name: 'Households', href: '/households' },
  ];
  
  const handleProfileClick = () => {
    router.push('/profile');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-emerald-600">Finance</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'border-emerald-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-1 text-sm text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  <span>{userInfo?.name || session?.user?.name || 'User'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="ml-1"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 