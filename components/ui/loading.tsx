'use client';

import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'pulse' | 'dots' | 'skeleton';
  className?: string;
}

export function Loading({ 
  message = 'Loading...', 
  size = 'md',
  variant = 'spinner',
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[200px]', className)}>
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 bg-blue-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce"></div>
        </div>
        {message && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[200px]', className)}>
        <div className={cn('rounded-full bg-gradient-to-r from-teal-primary to-blue-secondary', sizeClasses[size])}>
          <div className={cn('rounded-full bg-white dark:bg-gray-900 m-1 animate-pulse', size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14')}></div>
        </div>
        {message && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mt-6"></div>
        </div>
      </div>
    );
  }

  // Default spinner variant - Updated to match PageLoading style for consistency
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px]', className)}>
      {/* Use same animation style as PageLoading for consistency */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 bg-blue-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce"></div>
        </div>
      </div>
      {message && (
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      )}
      {/* Progress bar - Using Design System Colors */}
      <div className="mt-6 w-64 mx-auto">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-primary to-blue-secondary rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

// Standardized loading component with oval spinning animation
export function PageLoading({ message = 'Loading...', fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  const { tenant } = useAuthStore()
  
  // Get business name or default to "V3"
  const displayText = tenant?.name ? tenant.name : 'V3'
  
  const content = (
    <div className="text-center">
      {/* Animated logo/brand */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            {/* Gradient oval animation - Increased size - Using Design System Colors */}
            <div className="absolute inset-0 w-40 h-24 rounded-full bg-gradient-to-r from-teal-primary via-blue-secondary to-teal-primary animate-spin [animation-duration:3s] opacity-75 blur-sm"></div>
            <div className="relative w-40 h-24 rounded-full bg-gradient-to-r from-teal-primary to-blue-secondary flex items-center justify-center">
              {/* Business name or V3 text in white */}
              <span className="text-white font-bold text-base md:text-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] px-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                {displayText.length > 12 ? displayText.substring(0, 12) + '...' : displayText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading animation - Using Design System Colors */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 bg-blue-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 bg-teal-primary rounded-full animate-bounce"></div>
        </div>
      </div>

      {/* Loading text */}
      <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      
      {/* Progress bar - Using Design System Colors */}
      <div className="mt-6 w-64 mx-auto">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-primary to-blue-secondary rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {content}
    </div>
  )
}

// Dashboard-specific loading component (uses PageLoading)
export function DashboardLoading({ message = 'Loading your dashboard...' }: { message?: string }) {
  return <PageLoading message={message} fullScreen={true} />
}

