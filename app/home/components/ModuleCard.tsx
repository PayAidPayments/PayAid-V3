'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';
import { cn } from '@/lib/utils/cn';
import { memo } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';

// Custom Rupee Icon Component
const RupeeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <span className={className} style={{ ...style, fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1' }}>₹</span>
);

interface ModuleCardProps {
  module: {
    id: string;
    name: string;
    description: string;
    icon: string;
    url: string;
    status: "active" | "coming-soon" | "beta" | "deprecated";
    category: string;
    color: string;
  };
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }> | null; // Pre-loaded icon component
}

function ModuleCardComponent({ module, icon: Icon }: ModuleCardProps) {
  const params = useParams();
  const { tenant } = useAuthStore();
  
  // Safely get tenantId - handle both string and array cases
  const tenantIdParam = params?.tenantId;
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null);
  const tenantId: string | undefined = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : (tenant?.id && typeof tenant.id === 'string' && tenant.id.trim() ? tenant.id : undefined);
  
  // Construct module URL - always use base module URL to let entry point handle redirect
  const getModuleUrl = (): string => {
    // Always return base module URL (e.g., /crm, /sales, /finance)
    // The module entry point will handle redirecting to /module/[tenantId]/Home/
    // This ensures auth state is properly checked before redirecting
    return module.url;
  };
  
  const statusConfig = {
    active: { label: "Active", className: "bg-success-light text-success border border-success/30", style: {} },
    "coming-soon": { label: "Coming Soon", className: "bg-warning-light text-warning border border-warning/30", style: {} },
    beta: { label: "Beta", className: "bg-info-light text-info border border-info/30", style: {} },
    deprecated: { label: "Deprecated", className: "bg-gray-100 text-gray-700 border border-gray-300", style: {} }
  };

  // Default to "active" if status is missing or invalid
  const moduleStatus = module.status || "active";
  const status = statusConfig[moduleStatus] || statusConfig.active;

  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1')
  
  const isComingSoon = moduleStatus === 'coming-soon' && isProduction

  const handleClick = (e: React.MouseEvent) => {
    // Disable clicks for "Coming Soon" modules in production
    if (isComingSoon) {
      e.preventDefault()
    }
  }

  return (
    <Link 
      href={isComingSoon ? '#' : getModuleUrl()}
      onClick={handleClick}
      className={cn(
        // Design System: Card with proper hover states and animations
        "group relative block p-6",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "rounded-lg",
        "transition-all duration-150 ease-in-out",
        isComingSoon 
          ? "opacity-60 cursor-not-allowed" 
          : "hover:shadow-md hover:border-purple-300 dark:hover:border-purple-400 hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${module.color}15` }}
        >
          {module.icon === 'IndianRupee' ? (
            <RupeeIcon 
              className="w-6 h-6" 
              style={{ color: module.color }}
            />
          ) : Icon ? (
            <Icon 
              className="w-6 h-6" 
              style={{ color: module.color }}
            />
          ) : (
            <div className="w-6 h-6" style={{ backgroundColor: module.color, opacity: 0.3 }} />
          )}
        </div>
        <Badge 
          className={clsx("text-xs", status.className)}
          style={status.style}
        >
          {status.label}
        </Badge>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200">
        {module.name}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {module.description}
      </p>
      
      <div className="flex items-center text-sm font-semibold text-purple-500 group-hover:text-purple-600 transition-colors duration-150">
        <span>Open</span>
        <svg 
          className="ml-2 w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Return true if props are equal (skip re-render), false if different (re-render)
export const ModuleCard = memo(ModuleCardComponent, (prevProps, nextProps) => {
  // Re-render only if module ID changes or icon changes
  // All other properties are compared by ID
  return prevProps.module.id === nextProps.module.id && prevProps.icon === nextProps.icon;
});

ModuleCard.displayName = 'ModuleCard';

