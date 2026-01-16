'use client';

import { ModuleCard } from './ModuleCard';
import { Loading } from '@/components/ui/loading';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth';

// Lazy import to avoid SSR evaluation
let modulesConfig: typeof import('@/lib/modules.config') | null = null;

async function getModulesConfig() {
  if (!modulesConfig) {
    modulesConfig = await import('@/lib/modules.config');
  }
  return modulesConfig;
}

export function ModuleGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [categorizedModules, setCategorizedModules] = useState({ core: [], productivity: [], ai: [] });
  const [iconMap, setIconMap] = useState<Record<string, any>>({});
  const [iconsLoading, setIconsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const { tenant, user, isAuthenticated, token } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
    // Load modules config only on client
    if (typeof window !== 'undefined') {
      // Fetch user and tenant data if authenticated
      if (isAuthenticated && tenant?.id && token) {
        fetch(`/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(res => res.json())
          .then(data => {
            setUserData(data);
          })
          .catch(err => console.error('Failed to fetch user data:', err));
      }
      
      getModulesConfig().then(async config => {
        setModules(config.modules);
        setCategorizedModules(config.getModulesByCategory());
        
        // Pre-load all icons at once
        const icons: Record<string, any> = {};
        const uniqueIcons = new Set(config.modules.map((m: any) => m.icon));
        
        try {
          const lucideReact = await import('lucide-react');
          for (const iconName of uniqueIcons) {
            // Skip custom icons that don't exist in lucide-react
            if (iconName === 'IndianRupee') {
              continue; // Handled by custom component in ModuleCard
            }
            const iconKey = iconName as keyof typeof lucideReact;
            if (lucideReact[iconKey]) {
              icons[iconName] = lucideReact[iconKey];
            } else {
              icons[iconName] = lucideReact.Users; // Fallback
            }
          }
          setIconMap(icons);
        } catch (error) {
          console.error('Failed to load icons:', error);
        } finally {
          setIconsLoading(false);
        }
      });
    }
  }, [isAuthenticated, tenant?.id, token]);
  
  // Extract stable dependencies to prevent unnecessary recalculations
  const licensedModules = userData?.tenant?.licensedModules || [];
  const userRole = userData?.role || user?.role;
  const trialEndsAt = userData?.tenant?.subscription?.trialEndsAt;
  
  // Calculate categories based on filtered modules (excluding industries)
  // Use the same stable dependencies as allAvailableModules
  const categories = useMemo(() => {
    if (!mounted || modules.length === 0) return [];
    
    // Use the same filtering logic as allAvailableModules to ensure counts match
    const allNonIndustryModules = modules.filter((m: any) => 
      m.category !== 'industry' && m.status !== 'deprecated'
    );
    
    // If not authenticated or userData not loaded yet, show all modules (will be filtered once data loads)
    if (!isAuthenticated || !userData) {
      return [
        { 
          id: 'core', 
          name: 'Core Business', 
          count: allNonIndustryModules.filter((m: any) => m.category === 'core').length 
        },
        { 
          id: 'productivity', 
          name: 'Productivity Suite', 
          count: allNonIndustryModules.filter((m: any) => m.category === 'productivity').length 
        },
        { 
          id: 'ai', 
          name: 'AI Services', 
          count: allNonIndustryModules.filter((m: any) => m.category === 'ai').length 
        }
      ];
    }
    
    const isInTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
    
    // Calculate filtered modules for count (same logic as allAvailableModules)
    let filteredForCount = allNonIndustryModules;
    
    if (!isInTrial && licensedModules.length > 0) {
      const productivityModuleIds = ['spreadsheet', 'docs', 'drive', 'slides', 'meet'];
      const hasProductivitySuite = licensedModules.includes('productivity');
      
      filteredForCount = allNonIndustryModules.filter((m: any) => {
        // Always show AI Studio
        if (m.id === 'ai-studio') return true;
        
        // If module is directly licensed
        if (licensedModules.includes(m.id)) return true;
        
        // If productivity suite is licensed, include all individual productivity modules
        if (hasProductivitySuite && productivityModuleIds.includes(m.id)) return true;
        
        return false;
      });
    } else if (!isInTrial && licensedModules.length === 0) {
      filteredForCount = [];
    }
    // If in trial, show all modules (already set above)
    
    return [
      { 
        id: 'core', 
        name: 'Core Business', 
        count: filteredForCount.filter((m: any) => m.category === 'core').length 
      },
      { 
        id: 'productivity', 
        name: 'Productivity Suite', 
        count: filteredForCount.filter((m: any) => m.category === 'productivity').length 
      },
      { 
        id: 'ai', 
        name: 'AI Services', 
        count: filteredForCount.filter((m: any) => m.category === 'ai').length 
      }
    ];
  }, [mounted, modules, licensedModules, trialEndsAt, userData, isAuthenticated]);

  // Calculate all available modules (before category filter)
  // Use stable dependencies to prevent unnecessary recalculations
  
  const allAvailableModules = useMemo(() => {
    if (!mounted || modules.length === 0) return [];
    
    // Exclude industries and deprecated modules (keep coming-soon modules visible)
    let filteredModules = modules.filter((m: any) => 
      m.category !== 'industry' && m.status !== 'deprecated'
    );
    
    // Check if tenant is in trial period
    const isInTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
    
    // If not in trial, filter by licensed modules or assigned modules
    if (!isInTrial && userData && licensedModules.length > 0) {
      const isAdmin = userRole === 'owner' || userRole === 'admin';
      
      // For admin/owner: show all licensed modules
      // For employees: show only assigned modules (from JWT token or user data)
      const allowedModules = licensedModules; // For now, same for admin and employees
      
      // Handle productivity suite: if 'productivity' is licensed, show all individual productivity modules
      const productivityModuleIds = ['spreadsheet', 'docs', 'drive', 'slides', 'meet'];
      const hasProductivitySuite = allowedModules.includes('productivity');
      
      filteredModules = filteredModules.filter((m: any) => {
        // Always show AI Studio
        if (m.id === 'ai-studio') return true;
        
        // If module is directly licensed
        if (allowedModules.includes(m.id)) return true;
        
        // If productivity suite is licensed, show all individual productivity modules
        if (hasProductivitySuite && productivityModuleIds.includes(m.id)) return true;
        
        return false;
      });
    } else if (!isInTrial && userData && licensedModules.length === 0) {
      // No modules licensed - show empty
      filteredModules = [];
    }
    // If in trial, show all modules (already filtered to exclude industries)
    
    return filteredModules;
  }, [mounted, modules, licensedModules, userRole, trialEndsAt, userData]);

  // Filter by category if selected
  const displayModules = useMemo(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      return allAvailableModules.filter((m: any) => m.category === selectedCategory);
    }
    return allAvailableModules;
  }, [selectedCategory, allAvailableModules]);

  if (!mounted || modules.length === 0) {
    return <Loading message="Loading modules..." variant="dots" />;
  }

  return (
    <div className="w-full">
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all' || selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Modules ({allAvailableModules.length || 0})
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayModules.map((module) => {
          // Ensure stable icon reference
          const IconComponent = iconMap[module.icon];
          return (
            <ModuleCard 
              key={module.id} 
              module={module} 
              icon={IconComponent}
            />
          );
        })}
      </div>

      {displayModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No modules found in this category.</p>
        </div>
      )}
    </div>
  );
}

