'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';
import { cn } from '@/lib/utils/cn';
import { memo } from 'react';

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
  
  const statusConfig = {
    active: { label: "Active", className: "bg-green-100 border-green-200", style: { color: '#53328A' } },
    "coming-soon": { label: "Coming Soon", className: "bg-yellow-100 border-yellow-200", style: { color: '#53328A' } },
    beta: { label: "Beta", className: "bg-blue-100 border-blue-200", style: { color: '#53328A' } },
    deprecated: { label: "Deprecated", className: "bg-gray-100 border-gray-200", style: { color: '#53328A' } }
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
      href={isComingSoon ? '#' : module.url}
      onClick={handleClick}
      className={cn(
        "group relative block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200",
        isComingSoon 
          ? "opacity-60 cursor-not-allowed" 
          : "hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
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
      
      <div className="flex items-center text-sm font-medium" style={{ color: module.color }}>
        <span>Open</span>
        <svg 
          className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" 
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

