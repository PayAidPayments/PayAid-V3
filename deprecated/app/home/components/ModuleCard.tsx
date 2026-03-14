'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { clsx } from 'clsx';
import { cn } from '@/lib/utils/cn';
import { memo, useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { getDashboardUrl } from '@/lib/utils/dashboard-url';
import { getModuleHomeUrl } from '@/lib/config/payaid-modules.config';
import { AppIcon } from '@/components/home/AppIcon';
import { MoreHorizontal } from 'lucide-react';

const MAX_DESCRIPTION_LENGTH = 80;

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
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }> | null;
  /** One-line metric(s) for the card, e.g. "12 open deals · 5 new leads" */
  metrics?: string;
}

function ModuleCardComponent({ module, icon: _Icon, metrics }: ModuleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);
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
  
  // Construct module URL - use tenant-scoped URL when we have tenantId so user goes directly to module
  const getModuleUrl = (): string => {
    // App Store / Marketplace: use tenant-scoped dashboard URL (decoupled structure)
    if (module.id === 'marketplace') {
      return getDashboardUrl('/marketplace');
    }
    // Productivity: go to Home dashboard so user can choose Docs, Sheets, Slides, etc.
    if (module.id === 'productivity' && tenantId) {
      return `/productivity/${tenantId}/Home`;
    }
    // AI Studio: go to tenant-scoped home
    if (module.id === 'ai-studio' && tenantId) {
      return `/ai-studio/${tenantId}/Home`;
    }
    // Decoupled module homes: one feature = one URL
    if (tenantId && ['analytics', 'industry-intelligence', 'appointments'].includes(module.id)) {
      return getModuleHomeUrl(module.id, tenantId);
    }
    // Other modules: base URL; entry point will redirect to /module/[tenantId]/Home/ when tenant loads
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

  const description =
    module.description.length > MAX_DESCRIPTION_LENGTH
      ? module.description.slice(0, MAX_DESCRIPTION_LENGTH).trim() + '…'
      : module.description;

  return (
    <div
      className={cn(
        'group relative block p-5',
        'rounded-2xl',
        'transition-all duration-[180ms] ease-out',
        isComingSoon
          ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 opacity-90 cursor-not-allowed'
          : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5'
      )}
    >
      <Link
        href={isComingSoon ? '#' : getModuleUrl()}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={isComingSoon ? undefined : `Open ${module.name}`}
      />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <AppIcon moduleId={module.id} size="lg" />
        <div className="flex items-center gap-2">
          <Badge className={clsx('text-xs', status.className)} style={status.style}>
            {status.label}
          </Badge>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Module options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 z-20">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const raw = localStorage.getItem('home-pinned-modules') || '[]';
                      const arr = JSON.parse(raw) as string[];
                      if (!arr.includes(module.id)) {
                        localStorage.setItem('home-pinned-modules', JSON.stringify([module.id, ...arr].slice(0, 8)));
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('home-pinned-modules-changed'));
                        }
                      }
                      setMenuOpen(false);
                    } catch (_) {}
                  }}
                >
                  Pin to Pinned &amp; Recent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100 mb-1 group-hover:text-slate-700 dark:group-hover:text-gray-200">
        {module.name}
      </h3>
      <p className="text-sm text-slate-600 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">
        {description}
      </p>
        <div className="flex items-center justify-between">
        {metrics && !isComingSoon ? (
          <p className="text-xs text-slate-500 dark:text-gray-400 truncate flex-1 mr-2">{metrics}</p>
        ) : (
          <span />
        )}
        {isComingSoon ? (
          <a
            href="/#pricing"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
          >
            Get notified
          </a>
        ) : (
          <span className="inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors shrink-0">
            Open
            <svg className="ml-1 w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Return true if props are equal (skip re-render), false if different (re-render)
export const ModuleCard = memo(ModuleCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.module.id === nextProps.module.id &&
    prevProps.icon === nextProps.icon &&
    prevProps.metrics === nextProps.metrics
  );
});

ModuleCard.displayName = 'ModuleCard';

