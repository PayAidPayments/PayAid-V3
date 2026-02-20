'use client'

import { Header } from '@/app/home/components/Header'
import { ModuleGrid } from '@/app/home/components/ModuleGrid'
import { NewsSidebar } from '@/components/news/NewsSidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useParams, useRouter } from 'next/navigation';

export default function TenantHomePage() {
  const [mounted, setMounted] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { tenant, isAuthenticated } = useAuthStore();
  const tenantId = params.tenantId as string;

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = () => {
      if (hasCheckedAuth) return;
      setHasCheckedAuth(true);

      let tokenFromStorage: string | null = null;
      let tenantFromStorage: any = null;
      
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            tokenFromStorage = parsed.state?.token || null;
            tenantFromStorage = parsed.state?.tenant || null;
          }
        } catch (error) {
          console.error('[HOME] Error reading from localStorage:', error);
        }
      }

      const currentState = useAuthStore.getState();
      const finalIsAuthenticated = currentState.isAuthenticated || !!tokenFromStorage;
      const finalTenant = currentState.tenant || tenantFromStorage;

      if (!finalIsAuthenticated && !tokenFromStorage) {
        router.replace('/login');
        return;
      }

      if (finalIsAuthenticated && finalTenant?.id && tenantId !== finalTenant.id) {
        router.replace(`/home/${finalTenant.id}`);
        return;
      }

      if (finalIsAuthenticated && finalTenant?.id && !tenantId) {
        router.replace(`/home/${finalTenant.id}`);
        return;
      }
    };

    const timeoutId = setTimeout(checkAuth, 200);
    return () => clearTimeout(timeoutId);
  }, [tenantId, router]);

  if (!mounted || (!hasCheckedAuth && isAuthenticated && tenant?.id !== tenantId)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            All-in-One Business Platform
          </h1>
          {mounted && tenant && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              Welcome, {tenant.name || 'Demo Business Pvt Ltd'}
            </p>
          )}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Trusted by 500+ Indian Businesses
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your entire business with 28 powerful modules. From CRM and Finance to AI-powered insights, everything you need in one place.
          </p>
        </div>

        <ModuleGrid />

        <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Pricing</Link></li>
                <li><Link href="/app-store" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">App Store</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/help" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Help Center</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Blog</Link></li>
                <li><Link href="/docs" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p>&copy; {new Date().getFullYear()} PayAid. All rights reserved.</p>
          </div>
        </footer>
      </main>
      
      <NewsSidebar />
    </div>
  );
}
